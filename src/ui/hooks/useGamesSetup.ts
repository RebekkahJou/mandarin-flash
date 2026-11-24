import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { GameKind } from '../../domain/gamePlayers';
import type { GameResult } from '../../domain/gameResult';
import type { MeaningMatchRoundCount } from '../../domain/meaningMatch';
import { DEFAULT_MEANING_MATCH_ROUND_COUNT } from '../../domain/meaningMatch';
import type { SpeedRaceOptions } from '../../domain/speedRace';
import {
  DEFAULT_SPEED_RACE_ROUND_COUNT,
  DEFAULT_SPEED_RACE_WORD_COUNT,
  SpeedRaceCardFront,
} from '../../domain/speedRace';
import { loadSharedWords } from '../../services/sharedWordsLoader';
import { useAppServices } from '../AppServicesContext';
import { useProfileSession } from '../ProfileSessionContext';

/** How many finished games the Games tab lists. */
const RECENT_GAME_COUNT = 5;

const DEFAULT_SPEED_RACE_OPTIONS: SpeedRaceOptions = {
  wordCount: DEFAULT_SPEED_RACE_WORD_COUNT,
  roundCount: DEFAULT_SPEED_RACE_ROUND_COUNT,
  cardFront: SpeedRaceCardFront.Meaning,
};

/**
 * The Games tab's choices: who to play, which game and its options, how many words the two
 * profiles share, and recent results. Starting a game opens its screen.
 */
export function useGamesSetup() {
  const { profiles, activeProfile } = useProfileSession();
  const { wordRepository, gameResultRepository, profileId } = useAppServices();
  const otherProfiles = profiles.filter((profile) => profile.id !== profileId);
  const [chosenOpponentId, setChosenOpponentId] = useState<number | null>(null);
  const opponent =
    otherProfiles.find((profile) => profile.id === chosenOpponentId) ?? otherProfiles[0] ?? null;
  const [sharedCount, setSharedCount] = useState<{ opponentId: number; count: number } | null>(
    null,
  );
  // Null while the chosen opponent's count loads, rather than another opponent's count.
  const sharedWordCount =
    sharedCount && sharedCount.opponentId === opponent?.id ? sharedCount.count : null;
  const [game, setGame] = useState(GameKind.SpeedRace);
  const [speedRaceOptions, setSpeedRaceOptions] = useState(DEFAULT_SPEED_RACE_OPTIONS);
  const [meaningMatchRounds, setMeaningMatchRounds] = useState<MeaningMatchRoundCount>(
    DEFAULT_MEANING_MATCH_ROUND_COUNT,
  );
  const [recentResults, setRecentResults] = useState<GameResult[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!activeProfile || !opponent) return undefined;
      let isCancelled = false;
      void loadSharedWords(activeProfile, opponent, wordRepository).then((pairs) => {
        if (!isCancelled) setSharedCount({ opponentId: opponent.id, count: pairs.length });
      });
      return () => {
        isCancelled = true;
      };
    }, [activeProfile, opponent, wordRepository]),
  );

  useFocusEffect(
    useCallback(() => {
      void gameResultRepository
        .listRecentGameResults(profileId, RECENT_GAME_COUNT)
        .then(setRecentResults);
    }, [gameResultRepository, profileId]),
  );

  const start = () => {
    if (!opponent) return;
    const opponentId = String(opponent.id);
    if (game === GameKind.SpeedRace) {
      const { wordCount, roundCount, cardFront } = speedRaceOptions;
      router.push({
        pathname: '/games/speed-race',
        params: {
          opponentId,
          wordCount: String(wordCount),
          roundCount: String(roundCount),
          cardFront,
        },
      });
      return;
    }
    router.push({
      pathname: '/games/meaning-match',
      params: { opponentId, roundCount: String(meaningMatchRounds) },
    });
  };

  return {
    profiles,
    otherProfiles,
    opponent,
    chooseOpponent: setChosenOpponentId,
    sharedWordCount,
    game,
    chooseGame: setGame,
    speedRaceOptions,
    updateSpeedRaceOptions: (changes: Partial<SpeedRaceOptions>) =>
      setSpeedRaceOptions((current) => ({ ...current, ...changes })),
    meaningMatchRounds,
    chooseMeaningMatchRounds: setMeaningMatchRounds,
    recentResults,
    start,
  };
}
