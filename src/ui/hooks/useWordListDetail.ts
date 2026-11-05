import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { PartOfSpeechWordList } from '../../domain/partOfSpeechWordList';
import type { WordList, WordListEntry } from '../../domain/wordList';
import { definitionsOverrideFor } from '../../domain/wordList';
import { buildWordListCsv, csvFileNameForList } from '../../services/csvExport';
import { findPartOfSpeechMismatches } from '../../services/partOfSpeechCheck';
import { useAppServices } from '../AppServicesContext';
import { confirm } from '../confirm';
import { shareCsvFile } from '../csvFiles';
import { CsvImportResult, useCsvImport } from './useCsvImport';

/** Loads one word list and handles removing words, editing meanings and CSV import/export. */
export function useWordListDetail(wordListId: number) {
  const { languageModule, wordListRepository, dictionaryLookup } = useAppServices();
  const importCsvIntoLists = useCsvImport();
  const [list, setList] = useState<WordList | null>(null);
  const [mismatchedWordIds, setMismatchedWordIds] = useState<ReadonlySet<number>>(new Set());

  const reload = useCallback(async () => {
    const loadedList = await wordListRepository.getListWithEntries(wordListId);
    setList(loadedList);
    if (loadedList) {
      setMismatchedWordIds(await findPartOfSpeechMismatches(loadedList, dictionaryLookup.lookUp));
    }
  }, [wordListId, wordListRepository, dictionaryLookup]);

  // Shown on highlighted rows in Nouns, Verbs and Adjectives.
  const mismatchWarning =
    list instanceof PartOfSpeechWordList ? `No ${list.partOfSpeech} meaning` : undefined;

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const removeEntry = async (entryId: number, headword: string) => {
    const isConfirmed = await confirm(
      'Remove word?',
      `Remove ${headword} from this list?`,
      'Remove',
    );
    if (!isConfirmed) return;
    await wordListRepository.removeEntry(entryId);
    await reload();
  };

  const setEntryMeanings = async (entry: WordListEntry, meanings: string[]) => {
    await wordListRepository.setEntryDefinitions(
      entry.entryId,
      definitionsOverrideFor(entry.word, meanings),
    );
    await reload();
  };

  const exportCsv = async () => {
    if (!list) return;
    await shareCsvFile(csvFileNameForList(list.name), buildWordListCsv(list.words, languageModule));
  };

  const importCsv = async () => {
    if (!list) return;
    if ((await importCsvIntoLists([list])) === CsvImportResult.Imported) await reload();
  };

  return {
    list,
    reload,
    mismatchedWordIds,
    mismatchWarning,
    removeEntry,
    setEntryMeanings,
    exportCsv,
    importCsv,
  };
}
