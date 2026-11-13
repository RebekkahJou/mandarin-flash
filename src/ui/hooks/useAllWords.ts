import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type { WordWithListIds } from '../../data/repositories/wordRepository';
import type { ListForAllWords } from '../../domain/allWordsView';
import {
  describeWordLists,
  hasWordsInListKind,
  isShownInAllWords,
} from '../../domain/allWordsView';
import { WordListKind } from '../../domain/wordList';
import { matchesWordSearch } from '../../domain/wordSearch';
import type { AllWordsOptionKey } from '../../services/allWordsOptions';
import {
  allWordsOptionChoices,
  allWordsViewOptions,
  hiddenByOptionsNote,
  selectedAllWordsOptions,
} from '../../services/allWordsOptions';
import { useAppServices, useSettings } from '../AppServicesContext';

/**
 * Every word in the profile with the names of its lists, filtered by the saved view options and
 * a search query.
 */
export function useAllWords() {
  const { profileId, languageBundle, wordRepository, wordListRepository } = useAppServices();
  const { settings, updateSetting } = useSettings();
  const [words, setWords] = useState<WordWithListIds[]>([]);
  const [lists, setLists] = useState<ListForAllWords[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);

  const refresh = useCallback(async () => {
    setLists(await wordListRepository.listInfos(profileId));
    setWords(await wordRepository.listWordsWithListIds(profileId));
  }, [profileId, wordRepository, wordListRepository]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const shownWords = useMemo(() => {
    const viewOptions = allWordsViewOptions(settings);
    return words.filter(({ word, listIds }) =>
      isShownInAllWords(word, listIds, lists, viewOptions),
    );
  }, [words, lists, settings]);

  const matchingWords = useMemo(
    () =>
      shownWords.filter(({ word, meanings }) =>
        matchesWordSearch(word, searchQuery, languageBundle.readingSearchKey, meanings),
      ),
    [shownWords, searchQuery, languageBundle],
  );

  const wordListIds = words.map(({ listIds }) => listIds);
  const optionChoices = allWordsOptionChoices({
    scriptStudyName: languageBundle.definition.scriptStudySets[0]?.name ?? null,
    hasScriptStudyCards: hasWordsInListKind(wordListIds, lists, WordListKind.ScriptStudy),
    hasComponents: hasWordsInListKind(wordListIds, lists, WordListKind.Components),
  });

  return {
    totalWordCount: words.length,
    matchingWords,
    searchQuery,
    setSearchQuery,
    describeLists: (listIds: readonly number[]) => describeWordLists(listIds, lists),
    showsLearningLevel: settings.allWordsShowsLearningLevel,
    hiddenNote: hiddenByOptionsNote(words.length - shownWords.length),
    options: {
      isVisible: isOptionsVisible,
      open: () => setIsOptionsVisible(true),
      close: () => setIsOptionsVisible(false),
      choices: optionChoices,
      selected: selectedAllWordsOptions(settings),
      toggle: (key: AllWordsOptionKey) => updateSetting(key, !settings[key]),
    },
  };
}
