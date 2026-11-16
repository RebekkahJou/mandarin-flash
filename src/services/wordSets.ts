import type { WordListRepository } from '../data/repositories/wordListRepository';
import type { WordRepository } from '../data/repositories/wordRepository';
import type { WordSetRepository } from '../data/repositories/wordSetRepository';
import type { DefaultWordListDefinition } from '../domain/defaultWordLists';
import { GENERAL_VOCABULARY_LIST_NAME } from '../domain/defaultWordLists';
import type { LanguageId } from '../domain/language';
import { PartOfSpeech } from '../domain/partOfSpeech';
import { listForStarterWordType } from '../domain/starterVocabulary';
import type { Word } from '../domain/word';
import type { WordList } from '../domain/wordList';
import type { WordSetTopic } from '../domain/wordSets';
import { WORD_SET_TOPIC_LIST_NAMES, withoutRepeatedWords } from '../domain/wordSets';
import type { DictionaryLookup, WordSetEntry, WordSetSummary } from './dictionaryLookup';
import { createProfileListFinder } from './profileListFinder';

export interface WordSetServices {
  profileId: number;
  languageId: LanguageId;
  /** The pack the sets come from; added sets are remembered per pack. */
  packId: string;
  /** The language's extra default lists, so words find e.g. Measure words. */
  languageExtraLists: readonly DefaultWordListDefinition[];
  dictionaryLookup: Pick<DictionaryLookup, 'wordSets' | 'wordSetEntries'>;
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
  wordSetRepository: WordSetRepository;
}

export interface WordSetChoice extends WordSetSummary {
  isAdded: boolean;
}

export interface WordSetAddition {
  /** New words, set by set. */
  addedWords: Word[];
  /** The new words curated as nouns, which can be split into characters. */
  addedNouns: Word[];
  /** Words the profile already had; they keep their meanings and join the topic's list. */
  alreadyHadCount: number;
  /** The list holding every word of the topic's sets, e.g. Health-related words. */
  topicListName: string;
}

/** The topic's sets in pack order, each marked when the profile already added it. */
export async function loadWordSetChoices(
  services: WordSetServices,
  topic: WordSetTopic,
): Promise<WordSetChoice[]> {
  const sets = await services.dictionaryLookup.wordSets(topic, services.languageId);
  const added = await services.wordSetRepository.addedSetIds(services.profileId, services.packId);
  return sets.map((set) => ({ ...set, isAdded: added.has(set.setId) }));
}

/** Adds an existing word to the given lists it isn't in yet. */
async function addToMissingLists(
  services: WordSetServices,
  word: Word,
  listIds: readonly number[],
): Promise<void> {
  const current = new Set(await services.wordListRepository.listIdsContainingWord(word.id));
  const missing = [...new Set(listIds)].filter((listId) => !current.has(listId));
  await services.wordListRepository.addWordToLists(
    word.id,
    missing.map((wordListId) => ({ wordListId })),
  );
}

async function createEntryWord(services: WordSetServices, entry: WordSetEntry): Promise<Word> {
  const { headword, variant, reading, meanings } = entry;
  return services.wordRepository.findOrCreateWord({
    profileId: services.profileId,
    headword,
    variant,
    reading,
    definitions: meanings,
  });
}

/**
 * Adds the chosen sets: each new word goes into General Vocabulary, the list for its curated
 * word type (created if missing), the topic's list (created if missing) and any extra lists
 * chosen, with its curated meanings. A word in several sets is added once; a word the profile
 * already has keeps its meanings and lists, and joins the topic's list and the extra lists.
 */
export async function addWordSets(
  services: WordSetServices,
  topic: WordSetTopic,
  setIds: readonly string[],
  extraListIds: readonly number[],
): Promise<WordSetAddition> {
  const { profileId, languageId, languageExtraLists } = services;
  const entries = withoutRepeatedWords(
    await services.dictionaryLookup.wordSetEntries(setIds, languageId),
  );
  const ensureList = await createProfileListFinder(profileId, services.wordListRepository);
  const topicListName = WORD_SET_TOPIC_LIST_NAMES[topic];
  const topicList = await ensureList({ name: topicListName });
  const generalList = await ensureList({ name: GENERAL_VOCABULARY_LIST_NAME });
  const addition: WordSetAddition = {
    addedWords: [],
    addedNouns: [],
    alreadyHadCount: 0,
    topicListName,
  };
  for (const entry of entries) {
    const existing = await services.wordRepository.findWord(
      profileId,
      entry.headword,
      entry.reading,
    );
    if (existing) {
      await addToMissingLists(services, existing, [topicList.id, ...extraListIds]);
      addition.alreadyHadCount++;
      continue;
    }
    const typeList: WordList = await ensureList(
      listForStarterWordType(entry.wordType, languageExtraLists),
    );
    const word = await createEntryWord(services, entry);
    await addToMissingLists(services, word, [
      generalList.id,
      typeList.id,
      topicList.id,
      ...extraListIds,
    ]);
    addition.addedWords.push(word);
    if (entry.wordType === PartOfSpeech.Noun) addition.addedNouns.push(word);
  }
  await services.wordSetRepository.recordAddedSets(profileId, services.packId, setIds);
  return addition;
}
