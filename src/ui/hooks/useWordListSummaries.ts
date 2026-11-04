import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { WordListSummary } from '../../data/repositories/wordListRepository';
import { useAppServices } from '../AppServicesContext';

/** Word lists with their current lengths, refreshed whenever the screen comes into focus. */
export function useWordListSummaries() {
  const { profileId, wordListRepository, wordRepository } = useAppServices();
  const [summaries, setSummaries] = useState<WordListSummary[]>([]);
  const [totalWordCount, setTotalWordCount] = useState(0);

  const refresh = useCallback(async () => {
    setSummaries(await wordListRepository.listSummaries(profileId));
    setTotalWordCount(await wordRepository.countWords(profileId));
  }, [profileId, wordListRepository, wordRepository]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { summaries, totalWordCount, refresh };
}
