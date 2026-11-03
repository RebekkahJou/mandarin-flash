import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { WordList } from '../../domain/wordList';
import { buildWordListCsv, csvFileNameForList } from '../../services/csvExport';
import type { CsvImportPlan } from '../../services/csvImport';
import { CsvTooLargeError, parseWordCsv, planCsvImport } from '../../services/csvImport';
import { useAppServices } from '../AppServicesContext';
import { confirm, showMessage } from '../confirm';
import { pickCsvFile, shareCsvFile } from '../csvFiles';

function describeImportPlan(plan: CsvImportPlan): string {
  const lines = [`${plan.wordsToAdd.length} new words will be added.`];
  if (plan.skippedDuplicates.length > 0) {
    lines.push(`${plan.skippedDuplicates.length} already in the list (skipped).`);
  }
  if (plan.unknownCharacters.length > 0) {
    lines.push(
      `${plan.unknownCharacters.length} not found and had no meaning: ${plan.unknownCharacters.join(', ')}`,
    );
  }
  if (plan.invalidRowNumbers.length > 0) {
    lines.push(`Rows without Chinese characters (skipped): ${plan.invalidRowNumbers.join(', ')}`);
  }
  return lines.join('\n');
}

/** Loads one word list and handles removing words, editing meanings and CSV import/export. */
export function useWordListDetail(wordListId: number) {
  const { profileId, wordListRepository, wordRepository, dictionaryLookup } = useAppServices();
  const [list, setList] = useState<WordList | null>(null);

  const reload = useCallback(async () => {
    setList(await wordListRepository.getListWithEntries(wordListId));
  }, [wordListId, wordListRepository]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const removeEntry = async (entryId: number, traditional: string) => {
    const isConfirmed = await confirm(
      'Remove word?',
      `Remove ${traditional} from this list?`,
      'Remove',
    );
    if (!isConfirmed) return;
    await wordListRepository.removeEntry(entryId);
    await reload();
  };

  const setEntryMeanings = async (entryId: number, meanings: string[]) => {
    await wordListRepository.setEntryDefinitions(entryId, meanings.length > 0 ? meanings : null);
    await reload();
  };

  const exportCsv = async () => {
    if (!list) return;
    await shareCsvFile(csvFileNameForList(list.name), buildWordListCsv(list.words));
  };

  const importCsv = async () => {
    if (!list) return;
    const picked = await pickCsvFile();
    if (!picked) return;
    try {
      const parsed = parseWordCsv(picked.text, picked.byteSize);
      const charactersInList = await wordListRepository.charactersInList(list.id);
      const plan = await planCsvImport(parsed, list, charactersInList, dictionaryLookup.lookUp);
      if (plan.wordsToAdd.length === 0) {
        showMessage('Nothing to import', describeImportPlan(plan));
        return;
      }
      if (!(await confirm('Import words?', describeImportPlan(plan), 'Import'))) return;
      for (const draft of plan.wordsToAdd) {
        const word = await wordRepository.findOrCreateWord({ profileId, ...draft });
        await wordListRepository.addWordToLists(word.id, [{ wordListId: list.id }]);
      }
      await reload();
    } catch (error) {
      const message =
        error instanceof CsvTooLargeError ? error.message : 'This file could not be read as a CSV.';
      showMessage('Import failed', message);
    }
  };

  return { list, removeEntry, setEntryMeanings, exportCsv, importCsv };
}
