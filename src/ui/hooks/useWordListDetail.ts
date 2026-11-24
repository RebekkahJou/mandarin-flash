import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { isNewWordsList } from '../../domain/newWordsList';
import { PartOfSpeechWordList } from '../../domain/partOfSpeechWordList';
import type { WordList, WordListEntry } from '../../domain/wordList';
import { definitionsForEntry, definitionsOverrideFor } from '../../domain/wordList';
import { buildWordListCsv, csvFileNameForList } from '../../services/csvExport';
import { findPartOfSpeechMismatches } from '../../services/partOfSpeechCheck';
import { WordSortPlace } from '../../services/wordSorting';
import { useAppServices } from '../AppServicesContext';
import { confirm } from '../confirm';
import { shareCsvFile } from '../csvFiles';
import { CsvImportResult, useCsvImport } from './useCsvImport';
import { useWordSorting } from './useWordSorting';

/**
 * Loads one word list in the saved word list sort order, and handles removing words, editing
 * meanings and CSV import/export.
 */
export function useWordListDetail(wordListId: number) {
  const { languageBundle, wordListRepository, dictionaryLookup } = useAppServices();
  const importCsvIntoLists = useCsvImport();
  const [list, setList] = useState<WordList | null>(null);
  const [mismatchedWordIds, setMismatchedWordIds] = useState<ReadonlySet<number>>(new Set());

  const reload = useCallback(async () => {
    const loadedList = await wordListRepository.getListWithEntries(wordListId);
    setList(loadedList);
    if (loadedList) {
      setMismatchedWordIds(
        await findPartOfSpeechMismatches(
          loadedList,
          dictionaryLookup.lookUp,
          dictionaryLookup.reliablePartsOfSpeech,
        ),
      );
    }
  }, [wordListId, wordListRepository, dictionaryLookup]);

  // Entries load newest first; each row carries the meanings the list shows, for English sorting.
  const rows = useMemo(
    () =>
      (list?.words ?? []).map((entry) => ({
        entry,
        word: entry.word,
        meanings: definitionsForEntry(entry),
      })),
    [list],
  );
  const sorting = useWordSorting(rows, WordSortPlace.WordLists);
  const sortedEntries = useMemo(
    () => sorting.sortedRows.map(({ entry }) => entry),
    [sorting.sortedRows],
  );

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
    await shareCsvFile(csvFileNameForList(list.name), buildWordListCsv(list.words, languageBundle));
  };

  const importCsv = async () => {
    if (!list) return;
    if ((await importCsvIntoLists([list])) === CsvImportResult.Imported) await reload();
  };

  return {
    list,
    sortedEntries,
    sortChoices: sorting.choices,
    reload,
    mismatchedWordIds,
    mismatchWarning,
    removeEntry,
    setEntryMeanings,
    exportCsv,
    importCsv,
    /** New Words fills itself: no CSV import, and its words can't be removed or edited here. */
    isFilledAutomatically: list !== null && isNewWordsList(list),
  };
}
