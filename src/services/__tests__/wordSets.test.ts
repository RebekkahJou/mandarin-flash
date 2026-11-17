/**
 * @jest-environment node
 */
import { migrateUserDatabase } from '../../data/migrations/userDatabaseMigrations';
import { createProfileRepository } from '../../data/repositories/profileRepository';
import { createWordListRepository } from '../../data/repositories/wordListRepository';
import { createWordRepository } from '../../data/repositories/wordRepository';
import { createWordSetRepository } from '../../data/repositories/wordSetRepository';
import type { SqlDatabase } from '../../data/sqlDatabase';
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { writeTestPack } from '../../data/testing/testPack';
import { LanguageId, languageDefinitionFor } from '../../domain/language';
import { PartOfSpeech } from '../../domain/partOfSpeech';
import { WordSetTopic } from '../../domain/wordSets';
import { toMainlandSimplified } from '../chineseConverter';
import type { DictionaryForm } from '../dictionaryLookup';
import { createDictionaryLookup } from '../dictionaryLookup';
import type { WordSetServices } from '../wordSets';
import { addWordSets, loadWordSetChoices } from '../wordSets';

const INSERT_SET_SQL = 'INSERT INTO word_sets (set_id, topic, title, position) VALUES (?, ?, ?, ?)';
const INSERT_ENTRY_SQL = `INSERT INTO word_set_entries (set_id, position, headword, variant,
  reading, variant_reading, part_of_speech, meanings, languages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const TRADITIONAL_FORM: DictionaryForm = { readsVariants: false, convertSentence: (text) => text };
const SIMPLIFIED_FORM: DictionaryForm = {
  readsVariants: true,
  convertSentence: toMainlandSimplified,
};

async function createWordSetPack(): Promise<SqlDatabase> {
  const pack = createInMemoryDatabase();
  await writeTestPack(pack);
  await pack.run(INSERT_SET_SQL, ['doctor', 'health', 'Going to the doctor', 1]);
  await pack.run(INSERT_SET_SQL, ['dental', 'health', 'Dental issues', 2]);
  const entries: (string | number)[][] = [
    ['doctor', 1, '醫生', '医生', 'yi1 sheng1', '', 'noun', '["doctor"]', ''],
    ['doctor', 2, '看病', '', 'kan4 bing4', '', 'verb', '["to see a doctor"]', ''],
    ['doctor', 3, '健保卡', '', 'jian4 bao3 ka3', '', 'noun', '["NHI card"]', 'zh-Hant'],
    ['doctor', 4, '醫保卡', '医保卡', 'yi1 bao3 ka3', '', 'noun', '["insurance card"]', 'zh-Hans'],
    ['doctor', 5, '我不舒服', '', 'wo3 bu4 shu1 fu5', '', 'phrase', '["I feel ill"]', ''],
    ['dental', 1, '牙醫', '牙医', 'ya2 yi1', '', 'noun', '["dentist"]', ''],
    ['dental', 2, '醫生', '医生', 'yi1 sheng1', '', 'noun', '["doctor"]', ''],
  ];
  for (const entry of entries) await pack.run(INSERT_ENTRY_SQL, entry);
  return pack;
}

async function setUp(languageId = LanguageId.MandarinTraditional, form = TRADITIONAL_FORM) {
  const database = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).createProfile('Me', languageId);
  const services: WordSetServices = {
    profileId: profile.id,
    languageId,
    packId: 'mandarin',
    languageExtraLists: languageDefinitionFor(languageId).extraDefaultWordLists,
    dictionaryLookup: createDictionaryLookup(await createWordSetPack(), form, [PartOfSpeech.Noun]),
    wordRepository: createWordRepository(database),
    wordListRepository: createWordListRepository(database),
    wordSetRepository: createWordSetRepository(database),
  };
  return services;
}

async function headwordsByList(services: WordSetServices) {
  const summaries = await services.wordListRepository.listSummaries(services.profileId);
  const result: Record<string, string[]> = {};
  for (const { list } of summaries) {
    const withEntries = await services.wordListRepository.getListWithEntries(list.id);
    const headwords = withEntries?.words.map((entry) => entry.word.headword) ?? [];
    if (headwords.length > 0) result[list.name] = headwords.sort();
  }
  return result;
}

async function listIdByName(services: WordSetServices, name: string): Promise<number> {
  const summaries = await services.wordListRepository.listSummaries(services.profileId);
  const summary = summaries.find(({ list }) => list.name === name);
  if (!summary) throw new Error(`Missing list ${name}`);
  return summary.list.id;
}

describe('word sets', () => {
  it("lists the topic's sets with counts for the profile's language", async () => {
    const services = await setUp();
    expect(await loadWordSetChoices(services, WordSetTopic.Health)).toEqual([
      { setId: 'doctor', title: 'Going to the doctor', entryCount: 4, isAdded: false },
      { setId: 'dental', title: 'Dental issues', entryCount: 2, isAdded: false },
    ]);
  });

  it('adds new words to the topic, General Vocabulary and word-type lists, once each', async () => {
    const services = await setUp();
    const addition = await addWordSets(services, WordSetTopic.Health, ['doctor', 'dental'], []);
    expect(addition.addedWords.map((word) => word.headword)).toEqual([
      '醫生',
      '看病',
      '健保卡',
      '我不舒服',
      '牙醫',
    ]);
    expect(addition.addedNouns.map((word) => word.headword)).toEqual(['醫生', '健保卡', '牙醫']);
    expect(addition.alreadyHadCount).toBe(0);
    expect(await headwordsByList(services)).toEqual({
      'General Vocabulary': ['健保卡', '我不舒服', '牙醫', '看病', '醫生'],
      Nouns: ['健保卡', '牙醫', '醫生'],
      Verbs: ['看病'],
      Phrases: ['我不舒服'],
      'Health-related words': ['健保卡', '我不舒服', '牙醫', '看病', '醫生'],
    });
    const doctor = await services.wordRepository.findWord(services.profileId, '醫生', 'yi1 sheng1');
    expect(doctor?.definitions).toEqual(['doctor']);
  });

  it('marks added sets', async () => {
    const services = await setUp();
    await addWordSets(services, WordSetTopic.Health, ['dental'], []);
    const choices = await loadWordSetChoices(services, WordSetTopic.Health);
    expect(choices.map((choice) => [choice.setId, choice.isAdded])).toEqual([
      ['doctor', false],
      ['dental', true],
    ]);
  });

  it('keeps words the profile had, adding them only to the topic and extra lists', async () => {
    const services = await setUp();
    const { wordRepository, wordListRepository, profileId } = services;
    const focusListId = await listIdByName(services, 'Focus Vocabulary');
    const doctor = await wordRepository.findOrCreateWord({
      profileId,
      headword: '醫生',
      reading: 'yi1 sheng1',
      definitions: ['physician'],
    });
    await wordListRepository.addWordToLists(doctor.id, [{ wordListId: focusListId }]);
    const addition = await addWordSets(services, WordSetTopic.Health, ['dental'], [focusListId]);
    expect(addition.addedWords.map((word) => word.headword)).toEqual(['牙醫']);
    expect(addition.alreadyHadCount).toBe(1);
    const lists = await headwordsByList(services);
    expect(lists['Focus Vocabulary']).toEqual(['牙醫', '醫生']);
    expect(lists['Health-related words']).toEqual(['牙醫', '醫生']);
    expect(lists['General Vocabulary']).toEqual(['牙醫']);
    expect((await wordRepository.getWord(doctor.id))?.definitions).toEqual(['physician']);
  });

  it('makes the topic list again after it was deleted', async () => {
    const services = await setUp();
    await addWordSets(services, WordSetTopic.Health, ['dental'], []);
    await services.wordListRepository.deleteList(
      await listIdByName(services, 'Health-related words'),
    );
    await addWordSets(services, WordSetTopic.Health, ['doctor'], []);
    expect((await headwordsByList(services))['Health-related words']).toEqual([
      '健保卡',
      '我不舒服',
      '看病',
      '醫生',
    ]);
  });

  it('reads Simplified forms and leaves out entries for other languages', async () => {
    const services = await setUp(LanguageId.MandarinSimplified, SIMPLIFIED_FORM);
    const addition = await addWordSets(services, WordSetTopic.Health, ['doctor'], []);
    expect(addition.addedWords.map((word) => [word.headword, word.variant])).toEqual([
      ['医生', '醫生'],
      ['看病', undefined],
      ['医保卡', '醫保卡'],
      ['我不舒服', undefined],
    ]);
  });

  it('offers no sets from a pack without word set tables', async () => {
    const services = await setUp();
    const pack = createInMemoryDatabase();
    await writeTestPack(pack);
    await pack.exec('DROP TABLE word_sets; DROP TABLE word_set_entries');
    const lookup = createDictionaryLookup(pack, TRADITIONAL_FORM, []);
    expect(
      await loadWordSetChoices({ ...services, dictionaryLookup: lookup }, WordSetTopic.Health),
    ).toEqual([]);
  });
});
