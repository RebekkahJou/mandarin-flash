import { useCallback, useEffect, useRef, useState } from 'react';

import type { PracticeSessionRepository } from '../../data/repositories/practiceSessionRepository';
import type { WordListRepository } from '../../data/repositories/wordListRepository';
import type { WordRepository } from '../../data/repositories/wordRepository';
import type { PracticeCard } from '../../domain/practiceCard';
import { distinctPracticeCards } from '../../domain/practiceCard';
import { buildPracticeSet } from '../../domain/practiceSetBuilder';
import { ReviewAnswer } from '../../domain/reviewEvent';
import { PracticeSession } from '../../domain/practiceSession';
import type { CardAnswerResult } from '../../domain/practiceSession';
import type { SessionTimes } from '../../domain/sessionTimer';
import { SessionTimer } from '../../domain/sessionTimer';
import type { CardFontFamily } from '../../services/fontRotation';
import { pickNextCardFont } from '../../services/fontRotation';
import { useAppServices } from '../AppServicesContext';
import { confirm } from '../confirm';

const TIMER_TICK_MS = 1000;

export interface PracticeSummary extends SessionTimes {
  cardCount: number;
  learnedCount: number;
}

interface LoadedSession {
  session: PracticeSession;
  timer: SessionTimer;
  cardsByWordId: Map<number, PracticeCard>;
}

interface SessionSources {
  wordListRepository: WordListRepository;
  wordRepository: WordRepository;
  practiceSessionRepository: PracticeSessionRepository;
}

async function loadCards(
  sources: SessionSources,
  wordListId: number,
): Promise<Map<number, PracticeCard>> {
  const list = await sources.wordListRepository.getListWithEntries(wordListId);
  const cards = distinctPracticeCards(list?.words ?? []);
  return new Map(cards.map((card) => [card.word.id, card]));
}

function startNewSet(cardsByWordId: Map<number, PracticeCard>, setSize: number): LoadedSession {
  const words = [...cardsByWordId.values()].map((card) => card.word);
  const practiceSet = buildPracticeSet(words, setSize);
  const session = new PracticeSession(practiceSet.map((word) => word.id));
  return { session, timer: new SessionTimer(), cardsByWordId };
}

/**
 * Picks up the list's paused set, or null when it has none. Words that left the list since
 * (New Words changes on its own) are still practiced, with their own meanings.
 */
async function resumePausedSet(
  sources: SessionSources,
  wordListId: number,
  cardsByWordId: Map<number, PracticeCard>,
): Promise<LoadedSession | null> {
  const paused = await sources.practiceSessionRepository.loadPausedSet(wordListId);
  if (!paused) return null;
  for (const wordId of paused.state.session.wordIds) {
    if (cardsByWordId.has(wordId)) continue;
    const word = await sources.wordRepository.getWord(wordId);
    if (word) cardsByWordId.set(wordId, { word, definitions: word.definitions });
  }
  const session = PracticeSession.fromSnapshot(paused.state.session, new Set(cardsByWordId.keys()));
  return { session, timer: new SessionTimer(Date.now, paused.state.timer), cardsByWordId };
}

/**
 * Runs one practice set: card order, reveal state, font rotation, timers and saving results. A
 * set can be paused and resumed later (isResuming).
 */
export function usePracticeSession(wordListId: number, setSize: number, isResuming: boolean) {
  const {
    profileId,
    wordListRepository,
    wordRepository,
    practiceSessionRepository,
    reviewEventRepository,
    cardFonts,
  } = useAppServices();
  const loadedRef = useRef<LoadedSession | null>(null);
  const [currentCard, setCurrentCard] = useState<PracticeCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [font, setFont] = useState<CardFontFamily>(() => pickNextCardFont(cardFonts, undefined));
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isDeckCompletePromptVisible, setIsDeckCompletePromptVisible] = useState(false);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const updateProgress = (session: PracticeSession) =>
    setProgress({ completed: session.completedCardCount, total: session.cardCount });

  useEffect(() => {
    let isCancelled = false;
    void (async () => {
      const sources = { wordListRepository, wordRepository, practiceSessionRepository };
      const cardsByWordId = await loadCards(sources, wordListId);
      const resumed = isResuming ? await resumePausedSet(sources, wordListId, cardsByWordId) : null;
      if (isCancelled) return;
      const loaded = resumed ?? startNewSet(cardsByWordId, setSize);
      loadedRef.current = loaded;
      setCurrentCard(cardsByWordId.get(loaded.session.currentWordId ?? -1) ?? null);
      setElapsedMs(loaded.timer.elapsedMs());
      updateProgress(loaded.session);
      setIsLoading(false);
    })();
    return () => {
      isCancelled = true;
    };
  }, [
    wordListId,
    setSize,
    isResuming,
    wordListRepository,
    wordRepository,
    practiceSessionRepository,
  ]);

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
    await practiceSessionRepository.saveCompletedSession({
      ...times,
      profileId,
      wordListId,
      setSize,
    });
  }, [practiceSessionRepository, profileId, setSize, summary, wordListId]);

  /** Saves the set for this list so it can be resumed from the Practice tab; time stops. */
  const pauseSession = useCallback(async () => {
    const loaded = loadedRef.current;
    if (!loaded || summary) return;
    loaded.timer.pause();
    await practiceSessionRepository.savePausedSet(profileId, {
      wordListId,
      setSize,
      state: { session: loaded.session.toSnapshot(), timer: loaded.timer.toSnapshot() },
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
    summary,
  };
}
