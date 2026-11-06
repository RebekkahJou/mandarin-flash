import type { WordList } from '../../domain/wordList';
import { haveSameMeanings } from '../../domain/wordList';
import type { ListImportPlan } from '../../services/csvImport';
import {
  CsvTooLargeError,
  describeImportPlans,
  parseWordCsv,
  planCsvImport,
} from '../../services/csvImport';
import type { DictionaryEntry } from '../../services/dictionaryLookup';
import { useAppServices } from '../AppServicesContext';
import { confirm, showMessage } from '../confirm';
import { pickCsvFile } from '../csvFiles';

export enum CsvImportResult {
  Imported = 'imported',
  NotImported = 'not_imported',
}

type LookUp = (headword: string) => Promise<DictionaryEntry[]>;

/** Each list is planned separately, so a word is looked up once instead of once per list. */
function cachedLookUp(lookUp: LookUp): LookUp {
  const cache = new Map<string, Promise<DictionaryEntry[]>>();
  return (headword) => {
    const cached = cache.get(headword) ?? lookUp(headword);
    cache.set(headword, cached);
    return cached;
  };
}

/** Picks a CSV file, shows what would be imported into the target lists, then saves it. */
export function useCsvImport() {
  const { profileId, languageBundle, wordListRepository, wordRepository, dictionaryLookup } =
    useAppServices();

  const planImport = async (
    csvText: string,
    byteSize: number,
    targetLists: readonly WordList[],
  ) => {
    const parsed = parseWordCsv(csvText, languageBundle, byteSize);
    const lookUp = cachedLookUp(dictionaryLookup.lookUp);
    const listPlans: (ListImportPlan & { wordList: WordList })[] = [];
    for (const wordList of targetLists) {
      const headwordsInList = await wordListRepository.headwordsInList(wordList.id);
      const plan = await planCsvImport(parsed, wordList, headwordsInList, lookUp);
      listPlans.push({ wordList, listName: wordList.name, plan });
    }
    return listPlans;
  };

  /** A word that already exists keeps its own meanings; the file's meanings go on this list only. */
  const saveListPlan = async ({ wordList, plan }: ListImportPlan & { wordList: WordList }) => {
    for (const draft of plan.wordsToAdd) {
      const word = await wordRepository.findOrCreateWord({ profileId, ...draft });
      const hasOwnMeanings = !haveSameMeanings(word.definitions, draft.definitions);
      await wordListRepository.addWordToLists(word.id, [
        {
          wordListId: wordList.id,
          definitionsOverride: hasOwnMeanings ? draft.definitions : undefined,
        },
      ]);
    }
  };

  const importCsv = async (targetLists: readonly WordList[]): Promise<CsvImportResult> => {
    if (targetLists.length === 0) return CsvImportResult.NotImported;
    const picked = await pickCsvFile();
    if (!picked) return CsvImportResult.NotImported;
    try {
      const listPlans = await planImport(picked.text, picked.byteSize, targetLists);
      const summary = describeImportPlans(listPlans);
      if (listPlans.every(({ plan }) => plan.wordsToAdd.length === 0)) {
        showMessage('Nothing to import', summary);
        return CsvImportResult.NotImported;
      }
      if (!(await confirm('Import words?', summary, 'Import'))) return CsvImportResult.NotImported;
      for (const listPlan of listPlans) await saveListPlan(listPlan);
      return CsvImportResult.Imported;
    } catch (error) {
      const message =
        error instanceof CsvTooLargeError ? error.message : 'This file could not be read as a CSV.';
      showMessage('Import failed', message);
      return CsvImportResult.NotImported;
    }
  };

  return importCsv;
}
