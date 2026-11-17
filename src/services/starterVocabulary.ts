import type { WordListRepository } from '../data/repositories/wordListRepository';
import type { WordRepository } from '../data/repositories/wordRepository';
import type { DefaultWordListDefinition } from '../domain/defaultWordLists';
import { GENERAL_VOCABULARY_LIST_NAME } from '../domain/defaultWordLists';
import { PartOfSpeech } from '../domain/partOfSpeech';
import type { NextStarterSet, StarterSetProgress } from '../domain/starterVocabulary';
import {
  isStarterWordLearned,
  listForStarterWordType,
  nextStarterSet,
} from '../domain/starterVocabulary';
import type { Word } from '../domain/word';
import type { WordList } from '../domain/wordList';
import type { DictionaryLookup, StarterWord } from './dictionaryLookup';
import { createProfileListFinder } from './profileListFinder';

export interface StarterVocabularyServices {
  profileId: number;
  /** The language's extra default lists, so starter words find e.g. Measure words. */
  languageExtraLists: readonly DefaultWordListDefinition[];
  dictionaryLookup: Pick<DictionaryLookup, 'starterSetSizes' | 'starterWords'>;
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
}

export interface StarterVocabularyStatus {
  /** Sets the profile has added, in set order. */
  addedSets: StarterSetProgress[];
  next: NextStarterSet | null;
  /** Number of sets the language's pack has; 0 when it has no starter vocabulary. */
  setCount: number;
  /** Words in the next set, or 0 when every set is added. */
  nextSetSize: number;
}

export interface StarterSetAddition {
  /** New words, in teaching order. */
  addedWords: Word[];
  /** The new words curated as nouns, which can be split into characters. */
  addedNouns: Word[];
  /** Words the profile already had; they count toward the set but aren't added again. */
  alreadyHadCount: number;
}

export async function loadStarterVocabularyStatus(
  services: StarterVocabularyServices,
): Promise<StarterVocabularyStatus> {
  const setSizes = await services.dictionaryLookup.starterSetSizes();
  const tierCounts = await services.wordRepository.starterSetTierCounts(services.profileId);
  const learnedBySet = new Map<number, number>();
  for (const { setNumber, frequencyTier, wordCount } of tierCounts) {
    const learned = isStarterWordLearned(frequencyTier) ? wordCount : 0;
    learnedBySet.set(setNumber, (learnedBySet.get(setNumber) ?? 0) + learned);
  }
  const addedSets = [...setSizes]
    .filter(([setNumber]) => learnedBySet.has(setNumber))
    .map(([setNumber, setSize]) => ({
      setNumber,
      setSize,
      learnedCount: learnedBySet.get(setNumber) ?? 0,
    }));
  const next = nextStarterSet(addedSets, [...setSizes.keys()]);
  return {
    addedSets,
    next,
    setCount: setSizes.size,
    nextSetSize: next ? (setSizes.get(next.setNumber) ?? 0) : 0,
  };
}

/** Finds or creates General Vocabulary and the list for each word type in the set. */
async function listsForStarterWords(
  services: StarterVocabularyServices,
  starterWords: readonly StarterWord[],
): Promise<{ generalList: WordList; listForWord: (word: StarterWord) => WordList }> {
  const { profileId, languageExtraLists, wordListRepository } = services;
  const ensureList = await createProfileListFinder(profileId, wordListRepository);
  const generalList = await ensureList({ name: GENERAL_VOCABULARY_LIST_NAME });
  const listByType = new Map<string, WordList>();
  for (const { wordType } of starterWords) {
    if (listByType.has(wordType)) continue;
    listByType.set(
      wordType,
      await ensureList(listForStarterWordType(wordType, languageExtraLists)),
    );
  }
  return {
    generalList,
    listForWord: (word) => listByType.get(word.wordType) ?? generalList,
  };
}

/**
 * Adds a starter set: each new word goes into General Vocabulary and the list for its curated
 * word type (created if the profile lacks it), with that list's suggested meanings. Words the
 * profile already has aren't duplicated but count toward the set.
 */
export async function addStarterSet(
  services: StarterVocabularyServices,
  setNumber: number,
): Promise<StarterSetAddition> {
  const { profileId, wordRepository, wordListRepository } = services;
  const starterWords = await services.dictionaryLookup.starterWords(setNumber);
  const { generalList, listForWord } = await listsForStarterWords(services, starterWords);
  const addition: StarterSetAddition = {
    addedWords: [],
    addedNouns: [],
    alreadyHadCount: 0,
  };
  for (const starterWord of starterWords) {
    const { headword, variant, reading, definitionCandidates } = starterWord.entry;
    const existing = await wordRepository.findWord(profileId, headword, reading);
    if (existing) {
      await wordRepository.assignStarterSet(existing.id, setNumber);
      addition.alreadyHadCount++;
      continue;
    }
    const typeList = listForWord(starterWord);
    const definitions = typeList.selectDefaultMeanings(definitionCandidates);
    const word = await wordRepository.findOrCreateWord({
      profileId,
      headword,
      variant,
      reading,
      definitions,
    });
    const targetListIds = [...new Set([generalList.id, typeList.id])];
    await wordListRepository.addWordToLists(
      word.id,
      targetListIds.map((wordListId) => ({ wordListId })),
    );
    await wordRepository.assignStarterSet(word.id, setNumber);
    addition.addedWords.push(word);
    if (starterWord.wordType === PartOfSpeech.Noun) addition.addedNouns.push(word);
  }
  return addition;
}
