import { useCallback, useEffect, useRef, useState } from 'react';

import type { PracticeCard } from '../../domain/practiceCard';
import { distinctPracticeCards } from '../../domain/practiceCard';
import { buildPracticeSet } from '../../domain/practiceSetBuilder';
import { PracticeSession } from '../../domain/practiceSession';
import type { CardAnswerResult } from '../../domain/practiceSession';
import type { SessionTimes } from '../../domain/sessionTimer';
import { SessionTimer } from '../../domain/sessionTimer';
import type { ChineseFontFamily } from '../../services/fontRotation';
import { pickNextChineseFont } from '../../services/fontRotation';
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

/** Runs one practice set: card order, reveal state, font rotation, timers and saving results. */
export function usePracticeSession(wordListId: number, setSize: number) {
  const { profileId, wordListRepository, wordRepository, practiceSessionRepository } =
    useAppServices();
  const loadedRef = useRef<LoadedSession | null>(null);
  const [currentCard, setCurrentCard] = useState<PracticeCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [font, setFont] = useState<ChineseFontFamily>(() => pickNextChineseFont(undefined));
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isDeckCompletePromptVisible, setIsDeckCompletePromptVisible] = useState(false);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const updateProgress = (session: PracticeSession) =>
    setProgress({ completed: session.completedCardCount, total: session.cardCount });

  useEffect(() => {
    let isCancelled = false;
    void (async () => {
      const list = await wordListRepository.getListWithEntries(wordListId);
      if (isCancelled) return;
      const cards = distinctPracticeCards(list?.words ?? []);
      const cardsByWordId = new Map(cards.map((card) => [card.word.id, card]));
      const practiceSet = buildPracticeSet(
        cards.map((card) => card.word),
        setSize,
      );
      const session = new PracticeSession(practiceSet.map((word) => word.id));
      loadedRef.current = { session, timer: new SessionTimer(), cardsByWordId };
      setCurrentCard(cardsByWordId.get(session.currentWordId ?? -1) ?? null);
      updateProgress(session);
      setIsLoading(false);
    })();
    return () => {
      isCancelled = true;
    };
  }, [wordListId, setSize, wordListRepository]);

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
    await practiceSessionRepository.saveCompletedSession({
      ...times,
      profileId,
      wordListId,
      setSize,
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
      setFont((previousFont) => pickNextChineseFont(previousFont));
    },
    [endSession],
  );

  const markMissed = useCallback(() => {
    const loaded = loadedRef.current;
    if (loaded) showNextCard(loaded.session.markMissed());
  }, [showNextCard]);

  const markGotten = useCallback(() => {
    const loaded = loadedRef.current;
    if (loaded) showNextCard(loaded.session.markGotten());
  }, [showNextCard]);

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
    showNextCard(loaded.session.markLearned());
  }, [showNextCard, wordRepository]);

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
    summary,
  };
}
