import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { WordListSummary } from '../../data/repositories/wordListRepository';
import { useAppServices } from '../AppServicesContext';

/** Word lists with their current lengths, refreshed whenever the screen comes into focus. */
export function useWordListSummaries() {
  const { profileId, wordListRepository } = useAppServices();
  const [summaries, setSummaries] = useState<WordListSummary[]>([]);

  const refresh = useCallback(async () => {
    setSummaries(await wordListRepository.listSummaries(profileId));
  }, [profileId, wordListRepository]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { summaries, refresh };
}
