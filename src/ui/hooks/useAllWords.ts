import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type { WordWithListIds } from '../../data/repositories/wordRepository';
import { matchesWordSearch } from '../../domain/wordSearch';
import { useAppServices } from '../AppServicesContext';

const NO_LIST_LABEL = 'Not in any list';

/** Every word in the profile with the names of its lists, filtered by a search query. */
export function useAllWords() {
  const { profileId, languageModule, wordRepository, wordListRepository } = useAppServices();
  const [words, setWords] = useState<WordWithListIds[]>([]);
  const [listNamesById, setListNamesById] = useState<ReadonlyMap<number, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = useCallback(async () => {
    const summaries = await wordListRepository.listSummaries(profileId);
    setListNamesById(new Map(summaries.map(({ list }) => [list.id, list.name])));
    setWords(await wordRepository.listWordsWithListIds(profileId));
  }, [profileId, wordRepository, wordListRepository]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const matchingWords = useMemo(
    () =>
      words.filter(({ word }) =>
        matchesWordSearch(word, searchQuery, languageModule.readingSearchKey),
      ),
    [words, searchQuery, languageModule],
  );

  const describeLists = (listIds: readonly number[]): string => {
    const names = listIds.flatMap((listId) => listNamesById.get(listId) ?? []);
    return names.length > 0 ? names.join(', ') : NO_LIST_LABEL;
  };

  return {
    totalWordCount: words.length,
    matchingWords,
    searchQuery,
    setSearchQuery,
    describeLists,
  };
}
