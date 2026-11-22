/** Text for games between profiles: the Games tab, turn hand-offs, scores and recent results. */
import { GameKind, GameWinner } from '../domain/gamePlayers';
import type { GameResult } from '../domain/gameResult';
import { MINIMUM_SHARED_WORDS_FOR_SPEED_RACE } from '../domain/speedRace';
import { MEANING_MATCH_OPTION_COUNT } from '../domain/meaningMatch';
import { formatDuration } from './savedPracticeText';
import { formatWordCount } from './wordCount';

export const GAME_NAMES: Readonly<Record<GameKind, string>> = {
  [GameKind.SpeedRace]: 'Speed race',
  [GameKind.MeaningMatch]: 'Meaning match',
};

export const GAME_DESCRIPTIONS: Readonly<Record<GameKind, string>> = {
  [GameKind.SpeedRace]:
    'Each round, you both get through the same shared words, each in your own language. Missed cards come back until you get them. The lower total time wins.',
  [GameKind.MeaningMatch]:
    'Take turns: one player picks a word, the other sees its meaning and finds the word in their own language among 4. The most right answers win.',
};

const MINIMUM_SHARED_WORDS: Readonly<Record<GameKind, number>> = {
  [GameKind.SpeedRace]: MINIMUM_SHARED_WORDS_FOR_SPEED_RACE,
  [GameKind.MeaningMatch]: MEANING_MATCH_OPTION_COUNT,
};

export const NO_OTHER_PROFILE_TEXT =
  'Games are played between two profiles on this phone, using words you both study. Add another user to play.';

export function sharedWordsText(sharedWordCount: number, otherName: string): string {
  return `You and ${otherName} share ${formatWordCount(sharedWordCount)}.`;
}

/** Why a game can't start yet; null when there are enough shared words. */
export function notEnoughSharedWordsText(game: GameKind, sharedWordCount: number): string | null {
  const needed = MINIMUM_SHARED_WORDS[game];
  if (sharedWordCount >= needed) return null;
  return `${GAME_NAMES[game]} needs at least ${formatWordCount(needed)} you both study.`;
}

export function passPhoneText(playerName: string): string {
  return `Pass the phone to ${playerName}`;
}

export function roundText(roundIndex: number, roundCount: number): string {
  return `Round ${roundIndex + 1} of ${roundCount}`;
}

export function turnText(turnIndex: number, turnCount: number): string {
  return `Turn ${turnIndex + 1} of ${turnCount}`;
}

export function winnerText(winner: GameWinner, firstName: string, secondName: string): string {
  if (winner === GameWinner.Tie) return 'It’s a tie!';
  return `${winner === GameWinner.First ? firstName : secondName} wins!`;
}

function scoreText(game: GameKind, score: number): string {
  return game === GameKind.SpeedRace ? formatDuration(score) : `${score}`;
}

/** One line for the recent games list, e.g. "Speed race: Me 1:56, Kid 2:10. Me won." */
export function gameResultText(result: GameResult, nameForProfile: (id: number) => string): string {
  const firstName = nameForProfile(result.firstProfileId);
  const secondName = nameForProfile(result.secondProfileId);
  const scores = `${firstName} ${scoreText(result.game, result.firstScore)}, ${secondName} ${scoreText(result.game, result.secondScore)}`;
  const outcome =
    result.winner === GameWinner.Tie
      ? 'A tie.'
      : `${result.winner === GameWinner.First ? firstName : secondName} won.`;
  return `${GAME_NAMES[result.game]}: ${scores}. ${outcome}`;
}
