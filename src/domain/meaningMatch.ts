/**
 * Meaning match: players take turns. The picker chooses one of 20 shared words; the answerer sees
 * its English meanings and picks the word in their own language from 4 options.
 */
import type { GameWinner } from './gamePlayers';
import { GamePlayer, otherPlayer, winnerByScore } from './gamePlayers';
import type { RandomSource } from './random';
import { shuffle } from './random';
import type { GameWord, SharedWordPair } from './sharedWords';

export const MEANING_MATCH_ROUND_COUNTS = [5, 10, 15, 20] as const;
export type MeaningMatchRoundCount = (typeof MEANING_MATCH_ROUND_COUNTS)[number];
export const DEFAULT_MEANING_MATCH_ROUND_COUNT: MeaningMatchRoundCount = 5;

/** How many shared words the picker chooses from. */
export const MEANING_MATCH_PICK_LIST_SIZE = 20;
/** How many words the answerer chooses between, the right one included. */
export const MEANING_MATCH_OPTION_COUNT = 4;

export interface MeaningMatchTurn {
  /** Counted from 0; each round has two turns, one per answerer. */
  turnIndex: number;
  picker: GamePlayer;
  answerer: GamePlayer;
}

export interface MeaningMatchScores {
  firstPlayerCorrect: number;
  secondPlayerCorrect: number;
}

export function canPlayMeaningMatch(sharedWordCount: number): boolean {
  return sharedWordCount >= MEANING_MATCH_OPTION_COUNT;
}

export function meaningMatchTurnCount(roundCount: number): number {
  return roundCount * 2;
}

/** Profile 1 picks first, so profile 2 answers first; then they swap every turn. */
export function meaningMatchTurn(turnIndex: number): MeaningMatchTurn {
  const picker = turnIndex % 2 === 0 ? GamePlayer.First : GamePlayer.Second;
  return { turnIndex, picker, answerer: otherPlayer(picker) };
}

export function wordFor<PairedWord extends GameWord>(
  pair: SharedWordPair<PairedWord>,
  player: GamePlayer,
): PairedWord {
  return player === GamePlayer.First ? pair.first : pair.second;
}

/** A fresh random choice of shared words for the picker's turn. */
export function meaningMatchPickList<PairedWord extends GameWord>(
  pairs: readonly SharedWordPair<PairedWord>[],
  random: RandomSource,
): SharedWordPair<PairedWord>[] {
  return shuffle(pairs, random).slice(0, MEANING_MATCH_PICK_LIST_SIZE);
}

/**
 * The answerer's own word for the chosen pair plus others from their shared words, shuffled. Words
 * written the same as the right one are left out, so exactly one option is right.
 */
export function meaningMatchOptions<PairedWord extends GameWord>(
  pairs: readonly SharedWordPair<PairedWord>[],
  chosen: SharedWordPair<PairedWord>,
  answerer: GamePlayer,
  random: RandomSource,
): PairedWord[] {
  const answer = wordFor(chosen, answerer);
  const usedHeadwords = new Set([answer.headword]);
  const others: PairedWord[] = [];
  for (const pair of shuffle(pairs, random)) {
    const candidate = wordFor(pair, answerer);
    if (usedHeadwords.has(candidate.headword)) continue;
    usedHeadwords.add(candidate.headword);
    others.push(candidate);
    if (others.length === MEANING_MATCH_OPTION_COUNT - 1) break;
  }
  return shuffle([answer, ...others], random);
}

export function addMeaningMatchAnswer(
  scores: MeaningMatchScores,
  answerer: GamePlayer,
  isCorrect: boolean,
): MeaningMatchScores {
  if (!isCorrect) return scores;
  if (answerer === GamePlayer.First) {
    return { ...scores, firstPlayerCorrect: scores.firstPlayerCorrect + 1 };
  }
  return { ...scores, secondPlayerCorrect: scores.secondPlayerCorrect + 1 };
}

export function meaningMatchWinner(scores: MeaningMatchScores): GameWinner {
  return winnerByScore(scores.firstPlayerCorrect, scores.secondPlayerCorrect, false);
}
