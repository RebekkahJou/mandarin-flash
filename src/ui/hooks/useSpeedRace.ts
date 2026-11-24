import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GameKind, GamePlayer } from '../../domain/gamePlayers';
import { wordFor } from '../../domain/meaningMatch';
import { PracticeSession } from '../../domain/practiceSession';
import { SessionTimer } from '../../domain/sessionTimer';
import type { SharedWordPair } from '../../domain/sharedWords';
import type {
  SpeedRaceOptions,
  SpeedRaceOutcome,
  SpeedRaceRoundTimes,
} from '../../domain/speedRace';
import { planSpeedRaceRounds, speedRaceOutcome } from '../../domain/speedRace';
import type { Word } from '../../domain/word';
import type { CardFontFamily } from '../../services/fontRotation';
import { pickNextCardFont } from '../../services/fontRotation';
import { useAppServices } from '../AppServicesContext';
import type { GamePlayerInfo, LoadedGamePlayers } from './useGamePlayers';

const TIMER_TICK_MS = 1000;

export enum SpeedRaceStage {
  /** Waiting for the player whose turn it is to tap Start. */
  Ready = 'ready',
  Playing = 'playing',
  Finished = 'finished',
}

interface Turn {
  roundIndex: number;
  player: GamePlayer;
}

/** A running turn: the player's cards in practice order and their timer. */
interface RunningTurn {
  session: PracticeSession;
  timer: SessionTimer;
}

function playerInfo(players: LoadedGamePlayers, player: GamePlayer): GamePlayerInfo {
  return player === GamePlayer.First ? players.first : players.second;
}

function currentWordOf(
  round: readonly SharedWordPair<Word>[],
  player: GamePlayer,
  wordId: number | undefined,
): Word | null {
  const pair = round.find((candidate) => wordFor(candidate, player).id === wordId);
  return pair ? wordFor(pair, player) : null;
}

/**
 * Runs a speed race: per round, the first player then the second gets through the round's
 * shared words, each in their own language; the result is saved once the last round ends.
 */
export function useSpeedRace(players: LoadedGamePlayers, options: SpeedRaceOptions) {
  const { gameResultRepository } = useAppServices();
  const [rounds] = useState(() => planSpeedRaceRounds(players.pairs, options, Math.random));
  const [stage, setStage] = useState(SpeedRaceStage.Ready);
  const [turn, setTurn] = useState<Turn>({ roundIndex: 0, player: GamePlayer.First });
  const [roundTimes, setRoundTimes] = useState<SpeedRaceRoundTimes[]>([]);
  const [lastTurnMs, setLastTurnMs] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<SpeedRaceOutcome | null>(null);
  const runningRef = useRef<RunningTurn | null>(null);
  const firstPlayerRoundMsRef = useRef(0);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [font, setFont] = useState<CardFontFamily | undefined>(undefined);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (stage !== SpeedRaceStage.Playing) return undefined;
    const interval = setInterval(() => {
      setElapsedMs(runningRef.current?.timer.elapsedMs() ?? 0);
    }, TIMER_TICK_MS);
    return () => clearInterval(interval);
  }, [stage]);

  const round = useMemo(() => rounds[turn.roundIndex] ?? [], [rounds, turn.roundIndex]);
  const currentPlayer = playerInfo(players, turn.player);

  const showCard = useCallback(
    (session: PracticeSession) => {
      setCurrentWord(currentWordOf(round, turn.player, session.currentWordId));
      setIsRevealed(false);
      setProgress({ completed: session.completedCardCount, total: session.cardCount });
      setFont((previous) => pickNextCardFont(currentPlayer.cardFonts, previous));
    },
    [round, turn.player, currentPlayer],
  );

  const startTurn = () => {
    const wordIds = round.map((pair) => wordFor(pair, turn.player).id);
    const session = new PracticeSession(wordIds);
    runningRef.current = { session, timer: new SessionTimer() };
    setElapsedMs(0);
    showCard(session);
    setStage(SpeedRaceStage.Playing);
  };

  const finishGame = async (allRoundTimes: SpeedRaceRoundTimes[]) => {
    const result = speedRaceOutcome(allRoundTimes);
    setOutcome(result);
    setStage(SpeedRaceStage.Finished);
    await gameResultRepository.saveGameResult({
      game: GameKind.SpeedRace,
      firstProfileId: players.first.profileId,
      secondProfileId: players.second.profileId,
      options: { ...options },
      firstScore: result.firstPlayerTotalMs,
      secondScore: result.secondPlayerTotalMs,
      winner: result.winner,
      playedAtMs: Date.now(),
    });
  };

  const finishTurn = (turnMs: number) => {
    setLastTurnMs(turnMs);
    if (turn.player === GamePlayer.First) {
      firstPlayerRoundMsRef.current = turnMs;
      setTurn({ roundIndex: turn.roundIndex, player: GamePlayer.Second });
      setStage(SpeedRaceStage.Ready);
      return;
    }
    const allRoundTimes = [
      ...roundTimes,
      { firstPlayerMs: firstPlayerRoundMsRef.current, secondPlayerMs: turnMs },
    ];
    setRoundTimes(allRoundTimes);
    if (turn.roundIndex + 1 >= rounds.length) {
      void finishGame(allRoundTimes);
      return;
    }
    setTurn({ roundIndex: turn.roundIndex + 1, player: GamePlayer.First });
    setStage(SpeedRaceStage.Ready);
  };

  const answer = (isGotten: boolean) => {
    const running = runningRef.current;
    if (!running || !isRevealed) return;
    const result = isGotten ? running.session.markGotten() : running.session.markMissed();
    if (result.hasJustCompletedDeck) {
      finishTurn(running.timer.end().totalElapsedMs);
      return;
    }
    showCard(running.session);
  };

  return {
    stage,
    turn,
    roundCount: rounds.length,
    setSize: round.length,
    currentPlayer,
    currentWord,
    isRevealed,
    font,
    progress,
    elapsedMs,
    lastTurnMs,
    roundTimes,
    outcome,
    reveal: () => setIsRevealed(true),
    startTurn,
    markMissed: () => answer(false),
    markGotten: () => answer(true),
  };
}
