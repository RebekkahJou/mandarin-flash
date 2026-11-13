import { PartOfSpeech } from '../../domain/partOfSpeech';
import type { Word } from '../../domain/word';
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
import { partsOfSpeechOf } from '../../services/dictionaryLookup';
import { useAppServices } from '../AppServicesContext';
import { confirm, showMessage } from '../confirm';
import { pickCsvFile } from '../csvFiles';
import { useCharacterSplit } from './useCharacterSplit';

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
  const characterSplit = useCharacterSplit();

  const planImport = async (
    csvText: string,
    byteSize: number,
    targetLists: readonly WordList[],
    lookUp: LookUp,
  ) => {
    const parsed = parseWordCsv(csvText, languageBundle, byteSize);
    const listPlans: (ListImportPlan & { wordList: WordList })[] = [];
    for (const wordList of targetLists) {
      const headwordsInList = await wordListRepository.headwordsInList(wordList.id);
      const plan = await planCsvImport(
        parsed,
        wordList,
        headwordsInList,
        lookUp,
        dictionaryLookup.reliablePartsOfSpeech,
      );
      listPlans.push({ wordList, listName: wordList.name, plan });
    }
    return listPlans;
  };

  /** A word that already exists keeps its own meanings; the file's meanings go on this list only. */
  const saveListPlan = async ({
    wordList,
    plan,
  }: ListImportPlan & { wordList: WordList }): Promise<Word[]> => {
    const savedWords: Word[] = [];
    for (const draft of plan.wordsToAdd) {
      const word = await wordRepository.findOrCreateWord({ profileId, ...draft });
      const hasOwnMeanings = !haveSameMeanings(word.definitions, draft.definitions);
      await wordListRepository.addWordToLists(word.id, [
        {
          wordListId: wordList.id,
          definitionsOverride: hasOwnMeanings ? draft.definitions : undefined,
        },
      ]);
      savedWords.push(word);
    }
    return savedWords;
  };

  /** Imported nouns, each once, for offering their characters. */
  const importedNouns = async (savedWords: readonly Word[], lookUp: LookUp) => {
    const nouns = new Map<number, Word>();
    for (const word of savedWords) {
      const partsOfSpeech = partsOfSpeechOf(await lookUp(word.headword));
      if (partsOfSpeech.includes(PartOfSpeech.Noun)) nouns.set(word.id, word);
    }
    return [...nouns.values()];
  };

  const importCsv = async (targetLists: readonly WordList[]): Promise<CsvImportResult> => {
    if (targetLists.length === 0) return CsvImportResult.NotImported;
    const picked = await pickCsvFile();
    if (!picked) return CsvImportResult.NotImported;
    try {
      const lookUp = cachedLookUp(dictionaryLookup.lookUp);
      const listPlans = await planImport(picked.text, picked.byteSize, targetLists, lookUp);
      const summary = describeImportPlans(listPlans);
      if (listPlans.every(({ plan }) => plan.wordsToAdd.length === 0)) {
        showMessage('Nothing to import', summary);
        return CsvImportResult.NotImported;
      }
      if (!(await confirm('Import words?', summary, 'Import'))) return CsvImportResult.NotImported;
      const savedWords: Word[] = [];
      for (const listPlan of listPlans) savedWords.push(...(await saveListPlan(listPlan)));
      await characterSplit.offerForBulkAdd(await importedNouns(savedWords, lookUp));
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
