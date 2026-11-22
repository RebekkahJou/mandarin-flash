import type { GameKind, GameWinner } from './gamePlayers';

/** One finished game between two profiles. */
export interface GameResult {
  game: GameKind;
  firstProfileId: number;
  secondProfileId: number;
  /** The options the game was played with, e.g. words per set and rounds. */
  options: Record<string, string | number>;
  /** Total time in milliseconds (speed race) or correct answers (meaning match). */
  firstScore: number;
  secondScore: number;
  winner: GameWinner;
  playedAtMs: number;
}
