import { useState } from 'react';

import { defaultListIdsForNewWords } from '../../domain/defaultWordLists';
import type { WordList } from '../../domain/wordList';
import type { TextWordSearch } from '../../services/textWordFinder';
import { findWordsInText, foundWordsToImportRows } from '../../services/textWordFinder';
import { ALREADY_ADDED_NOTE, FOUND_WORDS_ADDED_MESSAGE } from '../../services/textWordFinderText';
import { useAppServices } from '../AppServicesContext';
import type { CheckableWord } from '../components/CheckableWordRows';
import { showMessage } from '../confirm';
import type { WordImportWording } from './useWordImport';
import { useSharedTextReceiver } from './useSharedTextReceiver';
import { useWordImport } from './useWordImport';

const FOUND_WORDS_WORDING: WordImportWording = {
  confirmTitle: 'Add words?',
  confirmLabel: 'Add',
  nothingNewTitle: 'Nothing to add',
};

function toCheckableWords(search: TextWordSearch | null): CheckableWord[] {
  return (search?.words ?? []).map(({ entry, isInProfile }) => ({
    key: entry.headword,
    headword: entry.headword,
    reading: entry.reading,
    meaning: entry.definitionCandidates[0]?.text ?? '',
    note: isInProfile ? ALREADY_ADDED_NOTE : undefined,
  }));
}

/** Words the profile already has start unchecked. */
function initiallyUnchecked(search: TextWordSearch): Set<string> {
  return new Set(
    search.words.filter((word) => word.isInProfile).map((word) => word.entry.headword),
  );
}

function toggled<Value>(values: ReadonlySet<Value>, value: Value): Set<Value> {
  const next = new Set(values);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/**
 * Find words in text: the user pastes text (or shares it from another app), sees the dictionary words in it, unchecks the ones
 * they don't need and adds the rest to the chosen lists.
 */
export function useFindWordsInText(lists: readonly WordList[]) {
  const { profileId, languageBundle, dictionaryLookup, wordRepository } = useAppServices();
  const importWords = useWordImport();
  const [text, setText] = useState('');
  const [search, setSearch] = useState<TextWordSearch | null>(null);
  const [uncheckedKeys, setUncheckedKeys] = useState<Set<string>>(new Set());
  const [isListPickerVisible, setIsListPickerVisible] = useState(false);
  const [explicitListIds, setExplicitListIds] = useState<Set<number> | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const selectedListIds = explicitListIds ?? defaultListIdsForNewWords(lists);
  const words = toCheckableWords(search);
  const checkedEntries = (search?.words ?? [])
    .map((word) => word.entry)
    .filter((entry) => !uncheckedKeys.has(entry.headword));

  const searchText = async (textToSearch: string) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const services = { profileId, languageBundle, dictionaryLookup, wordRepository };
      const found = await findWordsInText(services, textToSearch);
      setUncheckedKeys(initiallyUnchecked(found));
      setSearch(found);
    } finally {
      setIsBusy(false);
    }
  };

  const changeText = (nextText: string) => {
    setText(nextText);
    setSearch(null);
  };

  useSharedTextReceiver((sharedText) => {
    changeText(sharedText);
    void searchText(sharedText);
  });

  const addCheckedWords = async () => {
    const targetLists = lists.filter((list) => selectedListIds.has(list.id));
    if (targetLists.length === 0) {
      showMessage('No list selected', 'Choose at least one list to add the words to.');
      return;
    }
    setIsListPickerVisible(false);
    setIsBusy(true);
    try {
      const rows = foundWordsToImportRows(checkedEntries, Date.now());
      if (!(await importWords(rows, targetLists, FOUND_WORDS_WORDING))) return;
      changeText('');
      showMessage('Words added', FOUND_WORDS_ADDED_MESSAGE);
    } finally {
      setIsBusy(false);
    }
  };

  return {
    text,
    changeText,
    findWords: () => searchText(text),
    search,
    words,
    uncheckedKeys,
    toggleWord: (wordKey: string) => setUncheckedKeys(toggled(uncheckedKeys, wordKey)),
    checkedCount: checkedEntries.length,
    isBusy,
    listPicker: {
      isVisible: isListPickerVisible,
      open: () => setIsListPickerVisible(true),
      cancel: () => setIsListPickerVisible(false),
      selectedListIds,
      toggleList: (wordListId: number) => setExplicitListIds(toggled(selectedListIds, wordListId)),
      confirm: () => void addCheckedWords(),
    },
  };
}
