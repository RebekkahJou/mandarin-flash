/**
 * @jest-environment node
 */
import { migrateUserDatabase } from '../../data/migrations/userDatabaseMigrations';
import { createProfileRepository } from '../../data/repositories/profileRepository';
import { createWordListRepository } from '../../data/repositories/wordListRepository';
import { createWordRepository } from '../../data/repositories/wordRepository';
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { INSERT_PACK_ENTRY_SQL, writeTestPack } from '../../data/testing/testPack';
import { FrequencyTier } from '../../domain/frequencyTier';
import { LanguageId, languageDefinitionFor } from '../../domain/language';
import { PartOfSpeech } from '../../domain/partOfSpeech';
import { createDictionaryLookup } from '../dictionaryLookup';
import type { StarterVocabularyServices } from '../starterVocabulary';
import { addStarterSet, loadStarterVocabularyStatus } from '../starterVocabulary';

const INSERT_STARTER_SQL =
  'INSERT INTO starter_words (set_number, position, headword, reading, part_of_speech) VALUES (?, ?, ?, ?, ?)';

async function createStarterPack() {
  const pack = createInMemoryDatabase();
  await writeTestPack(pack);
  const entries: [string, string, string][] = [
    ['我', 'wo3', '[["I; me",16]]'],
    ['走', 'zou3', '[["to walk",2],["walking",1]]'],
    ['你好', 'ni3 hao3', '[["hello",0]]'],
    ['大', 'da4', '[["big",4]]'],
    ['今天', 'jin1 tian1', '[["today",1]]'],
  ];
  for (const [headword, reading, glosses] of entries) {
    await pack.run(INSERT_PACK_ENTRY_SQL, [headword, '', reading, '', glosses, -1]);
  }
  const starters: [number, number, string, string, string][] = [
    [1, 1, '我', 'wo3', 'pronoun'],
    [1, 2, '走', 'zou3', 'verb'],
    [1, 3, '你好', 'ni3 hao3', 'phrase'],
    [2, 1, '大', 'da4', 'adjective'],
    [2, 2, '今天', 'jin1 tian1', 'time word'],
  ];
  for (const row of starters) await pack.run(INSERT_STARTER_SQL, row);
  return pack;
}

async function setUp() {
  const database = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).createProfile(
    'Me',
    LanguageId.MandarinTraditional,
  );
  const dictionaryLookup = createDictionaryLookup(
    await createStarterPack(),
    { readsVariants: false, convertSentence: (text) => text },
    [PartOfSpeech.Noun, PartOfSpeech.Verb, PartOfSpeech.Adjective],
  );
  const services: StarterVocabularyServices = {
    profileId: profile.id,
    languageExtraLists: languageDefinitionFor(LanguageId.MandarinTraditional).extraDefaultWordLists,
    dictionaryLookup,
    wordRepository: createWordRepository(database),
    wordListRepository: createWordListRepository(database),
  };
  return services;
}

async function headwordsByList(services: StarterVocabularyServices) {
  const summaries = await services.wordListRepository.listSummaries(services.profileId);
  const result: Record<string, string[]> = {};
  for (const { list } of summaries) {
    const withEntries = await services.wordListRepository.getListWithEntries(list.id);
    const headwords = withEntries?.words.map((entry) => entry.word.headword) ?? [];
    if (headwords.length > 0) result[list.name] = headwords.sort();
  }
  return result;
}

describe('starter vocabulary', () => {
  it('offers set 1 before anything is added', async () => {
    const services = await setUp();
    expect(await loadStarterVocabularyStatus(services)).toEqual({
      addedSets: [],
      next: { setNumber: 1, isUnlocked: true },
      setCount: 2,
      nextSetSize: 3,
    });
  });

  it('adds each word to General Vocabulary and its word type list, creating missing lists', async () => {
    const services = await setUp();
    const addition = await addStarterSet(services, 1);
    expect(addition.addedWords.map((word) => word.headword)).toEqual(['我', '走', '你好']);
    expect(await headwordsByList(services)).toEqual({
      'General Vocabulary': ['你好', '我', '走'],
      Phrases: ['你好'],
      Pronouns: ['我'],
      Verbs: ['走'],
    });
  });

  it("uses the word type list's meanings", async () => {
    const services = await setUp();
    const [, walk] = (await addStarterSet(services, 1)).addedWords;
    expect(walk.definitions).toEqual(['to walk']);
  });

  it('counts words the profile already has without adding them again', async () => {
    const services = await setUp();
    await services.wordRepository.findOrCreateWord({
      profileId: services.profileId,
      headword: '走',
      reading: 'zou3',
      definitions: ['to go'],
    });
    const addition = await addStarterSet(services, 1);
    expect(addition.alreadyHadCount).toBe(1);
    expect(addition.addedWords).toHaveLength(2);
    const status = await loadStarterVocabularyStatus(services);
    expect(status.addedSets).toEqual([{ setNumber: 1, setSize: 3, learnedCount: 0 }]);
  });

  it('keeps the next set locked until 90% of the latest set is learned', async () => {
    const services = await setUp();
    const { addedWords } = await addStarterSet(services, 1);
    expect((await loadStarterVocabularyStatus(services)).next).toMatchObject({
      setNumber: 2,
      isUnlocked: false,
      learnedNeeded: 3,
    });
    for (const word of addedWords) {
      await services.wordRepository.setFrequencyTier(word.id, FrequencyTier.Retention);
    }
    const status = await loadStarterVocabularyStatus(services);
    expect(status.addedSets).toEqual([{ setNumber: 1, setSize: 3, learnedCount: 3 }]);
    expect(status.next).toEqual({ setNumber: 2, isUnlocked: true });
  });

  it('counts Memory reinforcement and Retention words together as learned', async () => {
    const services = await setUp();
    const [me, walk, hello] = (await addStarterSet(services, 1)).addedWords;
    await services.wordRepository.setFrequencyTier(me.id, FrequencyTier.MemoryReinforcement);
    await services.wordRepository.setFrequencyTier(walk.id, FrequencyTier.Retention);
    expect((await loadStarterVocabularyStatus(services)).next).toMatchObject({
      isUnlocked: false,
    });
    await services.wordRepository.setFrequencyTier(hello.id, FrequencyTier.MemoryReinforcement);
    const status = await loadStarterVocabularyStatus(services);
    expect(status.addedSets).toEqual([{ setNumber: 1, setSize: 3, learnedCount: 3 }]);
    expect(status.next).toEqual({ setNumber: 2, isUnlocked: true });
  });

  it('counts a word the profile had already learned toward unlocking', async () => {
    const services = await setUp();
    const walk = await services.wordRepository.findOrCreateWord({
      profileId: services.profileId,
      headword: '走',
      reading: 'zou3',
      definitions: ['to go'],
    });
    await services.wordRepository.setFrequencyTier(walk.id, FrequencyTier.Retention);
    await addStarterSet(services, 1);
    const status = await loadStarterVocabularyStatus(services);
    expect(status.addedSets).toEqual([{ setNumber: 1, setSize: 3, learnedCount: 1 }]);
  });

  it('puts time words in a new Time words list and has nothing left after the last set', async () => {
    const services = await setUp();
    await addStarterSet(services, 1);
    await addStarterSet(services, 2);
    const lists = await headwordsByList(services);
    expect(lists['Time words']).toEqual(['今天']);
    expect(lists.Adjectives).toEqual(['大']);
    expect((await loadStarterVocabularyStatus(services)).next).toBeNull();
  });
});
