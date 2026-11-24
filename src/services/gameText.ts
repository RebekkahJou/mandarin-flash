/** Text for games between profiles: the Games tab, turn hand-offs, scores and recent results. */
import { GameKind, GameWinner } from '../domain/gamePlayers';
import type { GameResult } from '../domain/gameResult';
import type { MeaningMatchScores } from '../domain/meaningMatch';
import { MEANING_MATCH_OPTION_COUNT } from '../domain/meaningMatch';
import type { SpeedRaceOutcome, SpeedRaceRoundTimes } from '../domain/speedRace';
import { MINIMUM_SHARED_WORDS_FOR_SPEED_RACE, SpeedRaceCardFront } from '../domain/speedRace';
import type { Profile } from '../domain/profileGroups';
import { languageBundleFor } from './languages/languageBundles';
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

/** The profile's name, plus its language when another profile has the same name. */
export function opponentLabel(profile: Profile, profiles: readonly Profile[]): string {
  const hasNamesake = profiles.some(
    (other) => other.id !== profile.id && other.name === profile.name,
  );
  if (!hasNamesake) return profile.name;
  return `${profile.name} · ${languageBundleFor(profile.languageId).definition.name}`;
}

export function startGameLabel(game: GameKind): string {
  return `Start ${GAME_NAMES[game].toLowerCase()}`;
}

export const COUNTING_SHARED_WORDS_TEXT = 'Counting the words you both study…';
export const NO_RECENT_GAMES_TEXT = 'No games yet.';

export const SPEED_RACE_CARD_FRONT_LABELS: Readonly<Record<SpeedRaceCardFront, string>> = {
  [SpeedRaceCardFront.Meaning]: 'English meaning',
  [SpeedRaceCardFront.Word]: 'The word',
};

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

export function speedRaceStartLabel(setSize: number): string {
  return `Start (${formatWordCount(setSize)})`;
}

export function gameProgressText(completed: number, total: number): string {
  return `${completed} / ${total} done`;
}

export function playerTurnTitle(playerName: string): string {
  return `${playerName}’s turn`;
}

export function turnTimeNote(playerName: string, turnMs: number): string {
  return `${playerName} took ${formatDuration(turnMs)}.`;
}

/** "Round 1: Me 1:23, Kid 1:40" */
export function speedRaceRoundLine(
  roundIndex: number,
  times: SpeedRaceRoundTimes,
  firstName: string,
  secondName: string,
): string {
  return `Round ${roundIndex + 1}: ${firstName} ${formatDuration(times.firstPlayerMs)}, ${secondName} ${formatDuration(times.secondPlayerMs)}`;
}

export function speedRaceTotalLine(
  outcome: SpeedRaceOutcome,
  firstName: string,
  secondName: string,
): string {
  return `Total: ${firstName} ${formatDuration(outcome.firstPlayerTotalMs)}, ${secondName} ${formatDuration(outcome.secondPlayerTotalMs)}`;
}

/** "Me 4 right, Kid 3 right" */
export function meaningMatchScoreLine(
  scores: MeaningMatchScores,
  firstName: string,
  secondName: string,
): string {
  return `${firstName} ${scores.firstPlayerCorrect} right, ${secondName} ${scores.secondPlayerCorrect} right`;
}

export function pickWordTitle(playerName: string): string {
  return `${playerName}, pick a word for the other player`;
}

export const MEANING_QUESTION_PROMPT = 'Which word has this meaning?';

export function pickWordHint(answererName: string): string {
  return `${answererName} will see its meaning and look for the word.`;
}

/** After an answer, the right option gets ✓ and a wrong pick ✗, so color isn't needed to tell. */
export function meaningOptionLabel(
  headword: string,
  isAnswered: boolean,
  isRightOption: boolean,
  isPicked: boolean,
): string {
  if (!isAnswered) return headword;
  if (isRightOption) return `${headword} ✓`;
  return isPicked ? `${headword} ✗` : headword;
}

export function answerFeedbackTitle(isCorrect: boolean): string {
  return isCorrect ? 'Right!' : 'Not quite.';
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
