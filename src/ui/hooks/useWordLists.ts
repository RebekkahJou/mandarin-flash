import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { WordList } from '../../domain/wordList';
import { useAppServices } from '../AppServicesContext';

/** The profile's word lists, reloaded whenever the screen comes into focus. */
export function useWordLists() {
  const { profileId, wordListRepository } = useAppServices();
  const [lists, setLists] = useState<WordList[]>([]);

  const refresh = useCallback(async () => {
    const summaries = await wordListRepository.listSummaries(profileId);
    setLists(summaries.map((summary) => summary.list));
  }, [profileId, wordListRepository]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { lists, refresh };
}
