import {
  COUNTING_SHARED_WORDS_TEXT,
  GAME_DESCRIPTIONS,
  NO_RECENT_GAMES_TEXT,
  gameResultText,
  notEnoughSharedWordsText,
  opponentLabel,
  sharedWordsText,
  startGameLabel,
} from '../../services/gameText';
import type { useGamesSetup } from './useGamesSetup';

type GamesSetup = ReturnType<typeof useGamesSetup>;

/** A finished game's line, keyed for the list. */
interface RecentLine {
  key: string;
  text: string;
}

const UNKNOWN_PROFILE_NAME = 'Deleted profile';

function recentLines(setup: GamesSetup): RecentLine[] {
  if (setup.recentResults.length === 0) return [{ key: 'none', text: NO_RECENT_GAMES_TEXT }];
  const nameForProfile = (profileId: number) =>
    setup.profiles.find((profile) => profile.id === profileId)?.name ?? UNKNOWN_PROFILE_NAME;
  return setup.recentResults.map((result) => ({
    key: `${result.playedAtMs}-${result.firstProfileId}-${result.secondProfileId}`,
    text: gameResultText(result, nameForProfile),
  }));
}

/** What the Challenges tab says, worked out from its choices. */
export function useGamesTabText(setup: GamesSetup) {
  const { opponent, sharedWordCount } = setup;
  const isCounting = sharedWordCount === null;
  const notEnoughWords = isCounting ? null : notEnoughSharedWordsText(setup.game, sharedWordCount);
  const sharedWords =
    isCounting || !opponent
      ? COUNTING_SHARED_WORDS_TEXT
      : sharedWordsText(sharedWordCount, opponent.name);
  return {
    opponentChoices: setup.otherProfiles.map((profile) => ({
      value: profile.id,
      label: opponentLabel(profile, setup.profiles),
    })),
    sharedWords,
    notEnoughWords,
    canStart: !isCounting && notEnoughWords === null,
    startLabel: startGameLabel(setup.game),
    gameDescription: GAME_DESCRIPTIONS[setup.game],
    recentLines: recentLines(setup),
  };
}
