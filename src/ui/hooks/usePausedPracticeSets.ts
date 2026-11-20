import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { PausedPracticeSet } from '../../data/repositories/practiceSessionRepository';
import {
  DISCARD_PAUSED_LABEL,
  DISCARD_PAUSED_MESSAGE,
  DISCARD_PAUSED_TITLE,
} from '../../services/pausedPracticeText';
import { useAppServices } from '../AppServicesContext';
import { confirm } from '../confirm';

/** The practice session route's resume param value that picks up the list's paused set. */
export const RESUME_PARAM_VALUE = '1';

/** The profile's paused practice sets by list, reloaded whenever the Practice tab shows. */
export function usePausedPracticeSets() {
  const { profileId, practiceSessionRepository } = useAppServices();
  const [pausedByListId, setPausedByListId] = useState<Map<number, PausedPracticeSet>>(new Map());

  const refresh = useCallback(async () => {
    const pausedSets = await practiceSessionRepository.listPausedSets(profileId);
    setPausedByListId(new Map(pausedSets.map((pausedSet) => [pausedSet.wordListId, pausedSet])));
  }, [profileId, practiceSessionRepository]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  /** Asks before a new set replaces the list's paused one; true when it's fine to start. */
  const confirmDiscard = async (wordListId: number): Promise<boolean> => {
    if (!pausedByListId.has(wordListId)) return true;
    const isConfirmed = await confirm(
      DISCARD_PAUSED_TITLE,
      DISCARD_PAUSED_MESSAGE,
      DISCARD_PAUSED_LABEL,
    );
    if (!isConfirmed) return false;
    await practiceSessionRepository.deletePausedSet(wordListId);
    await refresh();
    return true;
  };

  return {
    pausedSetFor: (wordListId: number | null) =>
      wordListId === null ? undefined : pausedByListId.get(wordListId),
    confirmDiscard,
  };
}
