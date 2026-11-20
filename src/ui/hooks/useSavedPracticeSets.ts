import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { SavedPracticeSet } from '../../data/repositories/practiceSessionRepository';
import { useAppServices } from '../AppServicesContext';

/** The profile's saved practice sets and their times by list, reloaded whenever the tab shows. */
export function useSavedPracticeSets() {
  const { profileId, practiceSessionRepository } = useAppServices();
  const [savedByListId, setSavedByListId] = useState<Map<number, SavedPracticeSet>>(new Map());

  const refresh = useCallback(async () => {
    const savedSets = await practiceSessionRepository.listSavedSets(profileId);
    setSavedByListId(new Map(savedSets.map((savedSet) => [savedSet.wordListId, savedSet])));
  }, [profileId, practiceSessionRepository]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    savedSetFor: (wordListId: number | null) =>
      wordListId === null ? undefined : savedByListId.get(wordListId),
  };
}
