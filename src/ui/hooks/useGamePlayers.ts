import { useEffect, useState } from 'react';

import type { PhoneticDisplay } from '../../data/repositories/settingsRepository';
import type { Profile } from '../../domain/profileGroups';
import type { SharedWordPair } from '../../domain/sharedWords';
import type { Word } from '../../domain/word';
import type { CardFontFamily } from '../../services/fontRotation';
import { cardFontRotation } from '../../services/fontRotation';
import { languageBundleFor } from '../../services/languages/languageBundles';
import { loadSharedWords } from '../../services/sharedWordsLoader';
import { useAppServices } from '../AppServicesContext';
import { useProfileSession } from '../ProfileSessionContext';

/** One player in a game, with what's needed to show cards their way. */
export interface GamePlayerInfo {
  profileId: number;
  name: string;
  /** The player's own pinyin or zhuyin setting. */
  phoneticDisplay: PhoneticDisplay;
  /** The fonts the player's cards rotate through. */
  cardFonts: readonly CardFontFamily[];
}

export interface LoadedGamePlayers {
  first: GamePlayerInfo;
  second: GamePlayerInfo;
  /** Each shared word as the first and the second player study it. */
  pairs: SharedWordPair<Word>[];
}

/**
 * The active profile (who starts and plays first) and the chosen opponent, with their shared
 * words. Null while loading or when the opponent no longer exists.
 */
export function useGamePlayers(opponentId: number): LoadedGamePlayers | null {
  const { profiles, activeProfile } = useProfileSession();
  const { wordRepository, settingsRepository } = useAppServices();
  const [loaded, setLoaded] = useState<LoadedGamePlayers | null>(null);
  const opponent = profiles.find((profile) => profile.id === opponentId) ?? null;

  useEffect(() => {
    if (!activeProfile || !opponent) return;
    let isCancelled = false;
    const playerInfo = async (profile: Profile): Promise<GamePlayerInfo> => ({
      profileId: profile.id,
      name: profile.name,
      phoneticDisplay: (await settingsRepository.loadSettings(profile.id)).phoneticDisplay,
      cardFonts: cardFontRotation(languageBundleFor(profile.languageId).usesBundledFonts, []),
    });
    void (async () => {
      const [first, second, pairs] = await Promise.all([
        playerInfo(activeProfile),
        playerInfo(opponent),
        loadSharedWords(activeProfile, opponent, wordRepository),
      ]);
      if (!isCancelled) setLoaded({ first, second, pairs });
    })();
    return () => {
      isCancelled = true;
    };
  }, [activeProfile, opponent, settingsRepository, wordRepository]);

  return loaded;
}
