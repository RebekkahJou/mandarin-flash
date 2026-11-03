import { useState } from 'react';

import { defaultListIdsForNewWords } from '../../domain/defaultWordLists';
import type { WordList } from '../../domain/wordList';
import { showMessage } from '../confirm';
import { CsvImportResult, useCsvImport } from './useCsvImport';

/** Import from the Word lists tab: choose target lists first (General Vocabulary by default). */
export function useListsTabImport(lists: readonly WordList[], onImported: () => void) {
  const importCsv = useCsvImport();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [explicitListIds, setExplicitListIds] = useState<Set<number> | null>(null);
  const selectedListIds = explicitListIds ?? defaultListIdsForNewWords(lists);

  const openPicker = () => {
    setExplicitListIds(null);
    setIsPickerVisible(true);
  };

  const toggleList = (wordListId: number) => {
    const next = new Set(selectedListIds);
    if (next.has(wordListId)) next.delete(wordListId);
    else next.add(wordListId);
    setExplicitListIds(next);
  };

  const chooseFileAndImport = async () => {
    const targetLists = lists.filter((list) => selectedListIds.has(list.id));
    if (targetLists.length === 0) {
      showMessage('No list selected', 'Choose at least one list to import the words into.');
      return;
    }
    setIsPickerVisible(false);
    if ((await importCsv(targetLists)) === CsvImportResult.Imported) onImported();
  };

  return {
    isPickerVisible,
    openPicker,
    cancel: () => setIsPickerVisible(false),
    selectedListIds,
    toggleList,
    chooseFileAndImport,
  };
}
