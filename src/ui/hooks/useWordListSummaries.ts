import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { WordListSummary } from '../../data/repositories/wordListRepository';
import { fillPendingComponentLists } from '../../services/componentsList';
import { useAppServices } from '../AppServicesContext';

/**
 * Word lists with their current lengths, refreshed whenever the screen comes into focus. Lists
 * filled from the language pack (Components) are filled first.
 */
export function useWordListSummaries() {
  const { profileId, wordListRepository, wordRepository, dictionaryLookup } = useAppServices();
  const [summaries, setSummaries] = useState<WordListSummary[]>([]);
  const [totalWordCount, setTotalWordCount] = useState(0);

  const refresh = useCallback(async () => {
    // A new Components list is filled before it is first shown, so its count is right.
    await fillPendingComponentLists({
      profileId,
      dictionaryLookup,
      wordRepository,
      wordListRepository,
    });
    setSummaries(await wordListRepository.listSummaries(profileId));
    setTotalWordCount(await wordRepository.countWords(profileId));
  }, [profileId, wordListRepository, wordRepository, dictionaryLookup]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { summaries, totalWordCount, refresh };
}
