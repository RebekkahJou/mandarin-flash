import { PartOfSpeech } from '../../domain/partOfSpeech';
import type { Word } from '../../domain/word';
import type { WordList } from '../../domain/wordList';
import { haveSameMeanings } from '../../domain/wordList';
import type { ListImportPlan, ParsedCsv } from '../../services/csvImport';
import { describeImportPlans, planCsvImport } from '../../services/csvImport';
import type { DictionaryEntry } from '../../services/dictionaryLookup';
import { partsOfSpeechOf } from '../../services/dictionaryLookup';
import { useAppServices } from '../AppServicesContext';
import { confirm, showMessage } from '../confirm';
import { useCharacterSplit } from './useCharacterSplit';

type LookUp = (headword: string) => Promise<DictionaryEntry[]>;

/** How the messages name the action. */
export interface WordImportWording {
  /** Title of the confirmation before saving, e.g. "Import words?". */
  confirmTitle: string;
  /** Its confirm button, e.g. "Import". */
  confirmLabel: string;
  /** Title of the message when none of the words is new to the lists, e.g. "Nothing to import". */
  nothingNewTitle: string;
}

/** Each list is planned separately, so a word is looked up once instead of once per list. */
function cachedLookUp(lookUp: LookUp): LookUp {
  const cache = new Map<string, Promise<DictionaryEntry[]>>();
  return (headword) => {
    const cached = cache.get(headword) ?? lookUp(headword);
    cache.set(headword, cached);
    return cached;
  };
}

/**
 * Adds words given as rows (from a CSV file or found in text) to the target lists: shows what
 * would be added, then saves it once the user confirms. Words already in a list are skipped.
 */
export function useWordImport() {
  const { profileId, wordListRepository, wordRepository, dictionaryLookup } = useAppServices();
  const characterSplit = useCharacterSplit();

  const planImport = async (
    parsed: ParsedCsv,
    targetLists: readonly WordList[],
    lookUp: LookUp,
  ) => {
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

  /** A word that already exists keeps its own meanings; the given meanings go on this list only. */
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

  /** Added nouns, each once, for offering their characters. */
  const addedNouns = async (savedWords: readonly Word[], lookUp: LookUp) => {
    const nouns = new Map<number, Word>();
    for (const word of savedWords) {
      const partsOfSpeech = partsOfSpeechOf(await lookUp(word.headword));
      if (partsOfSpeech.includes(PartOfSpeech.Noun)) nouns.set(word.id, word);
    }
    return [...nouns.values()];
  };

  /** True when words were saved. */
  const importWords = async (
    parsed: ParsedCsv,
    targetLists: readonly WordList[],
    wording: WordImportWording,
  ): Promise<boolean> => {
    if (targetLists.length === 0) return false;
    const lookUp = cachedLookUp(dictionaryLookup.lookUp);
    const listPlans = await planImport(parsed, targetLists, lookUp);
    const summary = describeImportPlans(listPlans);
    if (listPlans.every(({ plan }) => plan.wordsToAdd.length === 0)) {
      showMessage(wording.nothingNewTitle, summary);
      return false;
    }
    if (!(await confirm(wording.confirmTitle, summary, wording.confirmLabel))) return false;
    const savedWords: Word[] = [];
    for (const listPlan of listPlans) savedWords.push(...(await saveListPlan(listPlan)));
    await characterSplit.offerForBulkAdd(await addedNouns(savedWords, lookUp));
    return true;
  };

  return importWords;
}
