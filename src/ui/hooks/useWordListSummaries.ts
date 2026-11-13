import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type { WordListSummary } from '../../data/repositories/wordListRepository';
import type { Word } from '../../domain/word';
import type { ListForAllWords } from '../../domain/allWordsView';
import { countAllWords } from '../../domain/allWordsView';
import { allWordsViewOptions } from '../../services/allWordsOptions';
import { fillPendingComponentLists } from '../../services/componentsList';
import { updateSavedReadings } from '../../services/savedReadings';
import { useAppServices, useSettings } from '../AppServicesContext';

interface WordsForCount {
  words: { word: Pick<Word, 'frequencyTier'>; listIds: number[] }[];
  lists: ListForAllWords[];
}

/**
 * Word lists with their current lengths, and how many words All words shows with the saved view
 * options, refreshed whenever the screen comes into focus. Saved words first get the pack's
 * current readings (once per pack version), and lists filled from the pack (Components) are
 * filled.
 */
export function useWordListSummaries() {
  const {
    profileId,
    packId,
    packVersion,
    wordListRepository,
    wordRepository,
    settingsRepository,
    dictionaryLookup,
  } = useAppServices();
  const { settings } = useSettings();
  const [summaries, setSummaries] = useState<WordListSummary[]>([]);
  const [wordsForCount, setWordsForCount] = useState<WordsForCount>({ words: [], lists: [] });

  const refresh = useCallback(async () => {
    await updateSavedReadings({
      profileId,
      packVersionKey: `${packId}:${packVersion}`,
      dictionaryLookup,
      wordRepository,
      settingsRepository,
    });
    // A new Components list is filled before it is first shown, so its count is right.
    await fillPendingComponentLists({
      profileId,
      dictionaryLookup,
      wordRepository,
      wordListRepository,
    });
    setSummaries(await wordListRepository.listSummaries(profileId));
    setWordsForCount({
      words: await wordRepository.listWordLevelsWithListIds(profileId),
      lists: await wordListRepository.listInfos(profileId),
    });
  }, [
    profileId,
    packId,
    packVersion,
    wordListRepository,
    wordRepository,
    settingsRepository,
    dictionaryLookup,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  // Recounted when the options change, so the count matches All words without reloading.
  const { shownCount } = useMemo(
    () => countAllWords(wordsForCount.words, wordsForCount.lists, allWordsViewOptions(settings)),
    [wordsForCount, settings],
  );

  return { summaries, shownWordCount: shownCount, refresh };
}
