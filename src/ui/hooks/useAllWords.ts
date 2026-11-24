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
import type { WordSort } from '../../domain/wordSort';
import { availableSubSorts, availableWordSorts } from '../../domain/wordSort';
import { matchesWordSearch } from '../../domain/wordSearch';
import type { AllWordsOptionKey } from '../../services/allWordsOptions';
import {
  allWordsCountText,
  allWordsOptionChoices,
  allWordsViewOptions,
  selectedAllWordsOptions,
} from '../../services/allWordsOptions';
import type { RadicalLookup } from '../../services/allWordsSorting';
import {
  WORD_SORT_LABELS,
  resolvedAllWordsSorts,
  sortAllWords,
  wordSortContext,
} from '../../services/allWordsSorting';
import { deleteSelectedButtonLabel, deleteWordsPrompt } from '../../services/wordDeletionText';
import { useAppServices, useSettings } from '../AppServicesContext';
import { confirm } from '../confirm';

/** No radical data loaded (yet), so the radical sort falls back to code point order. */
const NO_RADICAL_DATA: RadicalLookup = () => undefined;

function sortChoices(sorts: readonly WordSort[]) {
  return sorts.map((sort) => ({ value: sort, label: WORD_SORT_LABELS[sort] }));
}

/**
 * Every word in the profile with the names of its lists, filtered by the saved view options and
 * a search query, in the saved sort order. Words can be selected and deleted together.
 */
export function useAllWords() {
  const { profileId, languageBundle, wordRepository, wordListRepository } = useAppServices();
  const { settings, updateSetting } = useSettings();
  const [words, setWords] = useState<WordWithListIds[]>([]);
  const [lists, setLists] = useState<ListForAllWords[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<ReadonlySet<number> | null>(null);

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

  const sortContext = wordSortContext(languageBundle.definition, settings);
  const { sort, subSort } = resolvedAllWordsSorts(sortContext, settings);
  const sortedWords = useMemo(() => {
    const context = wordSortContext(languageBundle.definition, settings);
    return sortAllWords(matchingWords, resolvedAllWordsSorts(context, settings), NO_RADICAL_DATA);
  }, [matchingWords, languageBundle, settings]);

  const wordListIds = words.map(({ listIds }) => listIds);
  const optionChoices = allWordsOptionChoices({
    scriptStudyName: languageBundle.definition.scriptStudySets[0]?.name ?? null,
    hasScriptStudyCards: hasWordsInListKind(wordListIds, lists, WordListKind.ScriptStudy),
    hasComponents: hasWordsInListKind(wordListIds, lists, WordListKind.Components),
  });

  const toggleWord = (wordId: number) => {
    if (!selectedWordIds) return;
    const next = new Set(selectedWordIds);
    if (next.has(wordId)) next.delete(wordId);
    else next.add(wordId);
    setSelectedWordIds(next);
  };

  const deleteSelected = async () => {
    if (!selectedWordIds || selectedWordIds.size === 0) return;
    const prompt = deleteWordsPrompt(selectedWordIds.size);
    if (!(await confirm(prompt.title, prompt.message, prompt.confirmLabel))) return;
    await wordRepository.deleteWords([...selectedWordIds]);
    setSelectedWordIds(null);
    await refresh();
  };

  return {
    totalWordCount: words.length,
    matchingWords: sortedWords,
    searchQuery,
    setSearchQuery,
    describeLists: (listIds: readonly number[]) => describeWordLists(listIds, lists),
    showsLearningLevel: settings.allWordsShowsLearningLevel,
    countText: allWordsCountText(shownWords.length, words.length - shownWords.length),
    selection: {
      isSelecting: selectedWordIds !== null,
      selectedWordIds,
      toggleSelecting: () => setSelectedWordIds(selectedWordIds ? null : new Set()),
      toggleWord,
      hasSelection: (selectedWordIds?.size ?? 0) > 0,
      deleteLabel: deleteSelectedButtonLabel(selectedWordIds?.size ?? 0),
      deleteSelected: () => void deleteSelected(),
    },
    options: {
      isVisible: isOptionsVisible,
      open: () => setIsOptionsVisible(true),
      close: () => setIsOptionsVisible(false),
      choices: optionChoices,
      selected: selectedAllWordsOptions(settings),
      toggle: (key: AllWordsOptionKey) => updateSetting(key, !settings[key]),
      sortChoices: sortChoices(availableWordSorts(sortContext)),
      selectedSort: sort,
      chooseSort: (choice: WordSort) => updateSetting('allWordsSort', choice),
      subSortChoices: sortChoices(availableSubSorts(sortContext)),
      selectedSubSort: subSort,
      chooseSubSort: (choice: WordSort) => updateSetting('allWordsSubSort', choice),
    },
  };
}
