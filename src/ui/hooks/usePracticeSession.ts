import { useCallback, useEffect, useRef, useState } from 'react';

import type { PracticeCard } from '../../domain/practiceCard';
import { ReviewAnswer } from '../../domain/reviewEvent';
import type { CardAnswerResult, PracticeSession } from '../../domain/practiceSession';
import type { SessionTimes } from '../../domain/sessionTimer';
import type { CardFontFamily } from '../../services/fontRotation';
import { pickNextCardFont } from '../../services/fontRotation';
import type { LoadedPracticeSet, PracticeStart } from '../../services/practiceSetLoading';
import { loadPracticeSet } from '../../services/practiceSetLoading';
import {
  REPLACE_SAVED_LABEL,
  REPLACE_SAVED_MESSAGE,
  REPLACE_SAVED_TITLE,
} from '../../services/savedPracticeText';
import { useAppServices } from '../AppServicesContext';
import { confirm } from '../confirm';

const TIMER_TICK_MS = 1000;

export interface PracticeSummary extends SessionTimes {
  cardCount: number;
  learnedCount: number;
}

/**
 * Runs one practice set: card order, reveal state, font rotation, timers and saving results. A
 * set can be paused and resumed later, and saved to practice again; finishing the saved set
 * records its time to get every word.
 */
export function usePracticeSession(wordListId: number, setSize: number, start: PracticeStart) {
  const {
    profileId,
    wordListRepository,
    wordRepository,
    practiceSessionRepository,
    reviewEventRepository,
    cardFonts,
  } = useAppServices();
  const loadedRef = useRef<LoadedPracticeSet | null>(null);
  const [currentCard, setCurrentCard] = useState<PracticeCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [font, setFont] = useState<CardFontFamily>(() => pickNextCardFont(cardFonts, undefined));
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isDeckCompletePromptVisible, setIsDeckCompletePromptVisible] = useState(false);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [isSavedSet, setIsSavedSet] = useState(false);

  const updateProgress = (session: PracticeSession) =>
    setProgress({ completed: session.completedCardCount, total: session.cardCount });

  useEffect(() => {
    let isCancelled = false;
    void (async () => {
      const sources = { wordListRepository, wordRepository, practiceSessionRepository };
      const loaded = await loadPracticeSet(sources, wordListId, setSize, start);
      if (isCancelled) return;
      loadedRef.current = loaded;
      setIsSavedSet(loaded.isSavedSet);
      setCurrentCard(loaded.cardsByWordId.get(loaded.session.currentWordId ?? -1) ?? null);
      setElapsedMs(loaded.timer.elapsedMs());
      updateProgress(loaded.session);
      setIsLoading(false);
    })();
    return () => {
      isCancelled = true;
    };
  }, [wordListId, setSize, start, wordListRepository, wordRepository, practiceSessionRepository]);

  useEffect(() => {
    if (isLoading || summary) return undefined;
    const interval = setInterval(() => {
      setElapsedMs(loadedRef.current?.timer.elapsedMs() ?? 0);
    }, TIMER_TICK_MS);
    return () => clearInterval(interval);
  }, [isLoading, summary]);

  const endSession = useCallback(async () => {
    const loaded = loadedRef.current;
    if (!loaded || summary) return;
    const times = loaded.timer.end();
    setSummary({
      ...times,
      cardCount: loaded.session.cardCount,
      learnedCount: loaded.session.learnedWordIdList.length,
    });
    setIsDeckCompletePromptVisible(false);
    await practiceSessionRepository.deletePausedSet(wordListId);
    if (loaded.isSavedSet && times.deckCompletedMs !== undefined) {
      await practiceSessionRepository.recordSavedSetTime(wordListId, times.deckCompletedMs);
    }
    await practiceSessionRepository.saveCompletedSession({
      ...times,
      profileId,
      wordListId,
      setSize,
    });
  }, [practiceSessionRepository, profileId, setSize, summary, wordListId]);

  /**
   * Keeps this set as the list's saved set, asking before it replaces another. Saved from the
   * summary, the run just finished counts as its first time.
   */
  const saveSet = useCallback(async () => {
    const loaded = loadedRef.current;
    if (!loaded || loaded.isSavedSet) return;
    const existing = await practiceSessionRepository.loadSavedSet(wordListId);
    if (existing) {
      const isConfirmed = await confirm(
        REPLACE_SAVED_TITLE,
        REPLACE_SAVED_MESSAGE,
        REPLACE_SAVED_LABEL,
      );
      if (!isConfirmed) return;
    }
    const { wordIds } = loaded.session.toSnapshot();
    await practiceSessionRepository.saveSavedSet(profileId, wordListId, wordIds);
    loaded.isSavedSet = true;
    setIsSavedSet(true);
    if (summary?.deckCompletedMs !== undefined) {
      await practiceSessionRepository.recordSavedSetTime(wordListId, summary.deckCompletedMs);
    }
  }, [practiceSessionRepository, profileId, summary, wordListId]);

  /** Saves the set for this list so it can be resumed from the Practice tab; time stops. */
  const pauseSession = useCallback(async () => {
    const loaded = loadedRef.current;
    if (!loaded || summary) return;
    loaded.timer.pause();
    await practiceSessionRepository.savePausedSet(profileId, {
      wordListId,
      setSize,
      state: {
        session: loaded.session.toSnapshot(),
        timer: loaded.timer.toSnapshot(),
        isSavedSet: loaded.isSavedSet,
      },
    });
  }, [practiceSessionRepository, profileId, setSize, summary, wordListId]);

  const showNextCard = useCallback(
    (result: CardAnswerResult) => {
      const loaded = loadedRef.current;
      if (!loaded) return;
      updateProgress(loaded.session);
      if (result.hasJustCompletedDeck) {
        loaded.timer.markDeckCompleted();
        setIsDeckCompletePromptVisible(true);
      }
      if (result.isAllLearned) {
        void endSession();
        return;
      }
      setCurrentCard(loaded.cardsByWordId.get(loaded.session.currentWordId ?? -1) ?? null);
      setIsRevealed(false);
      setFont((previousFont) => pickNextCardFont(cardFonts, previousFont));
    },
    [endSession, cardFonts],
  );

  /** Saved in the background so a slow write never holds up the next card. */
  const recordAnswer = useCallback(
    (wordId: number, answer: ReviewAnswer) => {
      void reviewEventRepository.recordReviewEvent({
        profileId,
        wordId,
        answer,
        answeredAtMs: Date.now(),
      });
    },
    [profileId, reviewEventRepository],
  );

  const markMissed = useCallback(() => {
    const loaded = loadedRef.current;
    const wordId = loaded?.session.currentWordId;
    if (!loaded || wordId === undefined) return;
    recordAnswer(wordId, ReviewAnswer.Missed);
    showNextCard(loaded.session.markMissed());
  }, [recordAnswer, showNextCard]);

  const markGotten = useCallback(() => {
    const loaded = loadedRef.current;
    const wordId = loaded?.session.currentWordId;
    if (!loaded || wordId === undefined) return;
    recordAnswer(wordId, ReviewAnswer.Gotten);
    showNextCard(loaded.session.markGotten());
  }, [recordAnswer, showNextCard]);

  const markLearned = useCallback(async () => {
    const loaded = loadedRef.current;
    const wordId = loaded?.session.currentWordId;
    if (!loaded || wordId === undefined) return;
    const isConfirmed = await confirm(
      'Mark as learned?',
      'This word will be shown less often in practice, in every list it belongs to.',
      'Mark learned',
    );
    if (!isConfirmed) return;
    await wordRepository.markWordLearned(wordId);
    recordAnswer(wordId, ReviewAnswer.Learned);
    showNextCard(loaded.session.markLearned());
  }, [recordAnswer, showNextCard, wordRepository]);

  return {
    isLoading,
    currentCard,
    isRevealed,
    reveal: () => setIsRevealed(true),
    font,
    elapsedMs,
    progress,
    isDeckCompletePromptVisible,
    keepGoing: () => setIsDeckCompletePromptVisible(false),
    markMissed,
    markGotten,
    markLearned,
    endSession,
    pauseSession,
    saveSet,
    isSavedSet,
    summary,
  };
}
