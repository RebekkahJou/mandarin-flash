/**
 * Speed race: each round both players get through the same shared words, each in their own
 * language, and the lower total time wins.
 */
import type { GameWinner } from './gamePlayers';
import { winnerByScore } from './gamePlayers';
import type { RandomSource } from './random';
import { shuffle } from './random';
import type { GameWord, SharedWordPair } from './sharedWords';

export const SPEED_RACE_WORD_COUNTS = [20, 40, 60] as const;
export type SpeedRaceWordCount = (typeof SPEED_RACE_WORD_COUNTS)[number];
export const DEFAULT_SPEED_RACE_WORD_COUNT: SpeedRaceWordCount = 20;

export const SPEED_RACE_ROUND_COUNTS = [1, 2, 3, 4, 5] as const;
export type SpeedRaceRoundCount = (typeof SPEED_RACE_ROUND_COUNTS)[number];
export const DEFAULT_SPEED_RACE_ROUND_COUNT: SpeedRaceRoundCount = 1;

/** Fewer shared words than this make too short a race to be worth timing. */
export const MINIMUM_SHARED_WORDS_FOR_SPEED_RACE = 10;

/** Which side of a card shows before it is revealed. */
export enum SpeedRaceCardFront {
  /** The English meaning; the player recalls the word in their own language. */
  Meaning = 'meaning',
  /** The word in the player's own language; the player recalls its meaning. */
  Word = 'word',
}

export interface SpeedRaceOptions {
  wordCount: SpeedRaceWordCount;
  roundCount: SpeedRaceRoundCount;
  cardFront: SpeedRaceCardFront;
}

/** Each player's time to get every card in one round. */
export interface SpeedRaceRoundTimes {
  firstPlayerMs: number;
  secondPlayerMs: number;
}

export interface SpeedRaceOutcome {
  firstPlayerTotalMs: number;
  secondPlayerTotalMs: number;
  winner: GameWinner;
}

export function canPlaySpeedRace(sharedWordCount: number): boolean {
  return sharedWordCount >= MINIMUM_SHARED_WORDS_FOR_SPEED_RACE;
}

/**
 * The shared words for each round: random, no word twice in a round, and no word again in a later
 * round until every shared word has had a turn.
 */
export function planSpeedRaceRounds<PairedWord extends GameWord>(
  pairs: readonly SharedWordPair<PairedWord>[],
  options: Pick<SpeedRaceOptions, 'wordCount' | 'roundCount'>,
  random: RandomSource,
): SharedWordPair<PairedWord>[][] {
  const setSize = Math.min(options.wordCount, pairs.length);
  let unusedPairs = shuffle(pairs, random);
  const rounds: SharedWordPair<PairedWord>[][] = [];
  for (let roundIndex = 0; roundIndex < options.roundCount; roundIndex++) {
    const round = unusedPairs.slice(0, setSize);
    unusedPairs = unusedPairs.slice(setSize);
    const missingCount = setSize - round.length;
    if (missingCount > 0) {
      // Every word has had a turn: start over with the words not already in this round.
      const refill = shuffle(
        pairs.filter((pair) => !round.includes(pair)),
        random,
      );
      round.push(...refill.slice(0, missingCount));
      unusedPairs = refill.slice(missingCount);
    }
    rounds.push(round);
  }
  return rounds;
}

export function speedRaceOutcome(roundTimes: readonly SpeedRaceRoundTimes[]): SpeedRaceOutcome {
  const firstPlayerTotalMs = roundTimes.reduce((total, round) => total + round.firstPlayerMs, 0);
  const secondPlayerTotalMs = roundTimes.reduce((total, round) => total + round.secondPlayerMs, 0);
  return {
    firstPlayerTotalMs,
    secondPlayerTotalMs,
    winner: winnerByScore(firstPlayerTotalMs, secondPlayerTotalMs, true),
  };
}
