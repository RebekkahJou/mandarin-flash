/**
 * @jest-environment node
 */
import { FrequencyTier } from '../../domain/frequencyTier';
import { distinctPracticeCards } from '../../domain/practiceCard';
import { PartOfSpeechWordList } from '../../domain/partOfSpeechWordList';
import { migrateUserDatabase } from '../migrations/userDatabaseMigrations';
import { createProfileRepository } from '../repositories/profileRepository';
import { PhoneticDisplay, createSettingsRepository } from '../repositories/settingsRepository';
import { createWordListRepository } from '../repositories/wordListRepository';
import { createWordRepository } from '../repositories/wordRepository';
import type { SqlDatabase } from '../sqlDatabase';
import { createInMemoryDatabase } from '../testing/nodeSqlDatabase';

async function setUp() {
  const database: SqlDatabase = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).ensureDefaultProfile();
  const wordRepository = createWordRepository(database);
  const wordListRepository = createWordListRepository(database);
  const summaries = await wordListRepository.listSummaries(profile.id);
  const listIdByName = (name: string) => {
    const summary = summaries.find((candidate) => candidate.list.name === name);
    if (!summary) throw new Error(`Missing default list ${name}`);
    return summary.list.id;
  };
  return { database, profile, wordRepository, wordListRepository, listIdByName };
}

const walkWord = { traditional: '走', pinyin: 'zou3', definitions: ['to walk'] };

describe('user database', () => {
  it('migrates idempotently', async () => {
    const database = createInMemoryDatabase();
    await migrateUserDatabase(database);
    await expect(migrateUserDatabase(database)).resolves.toBeUndefined();
  });

  it('creates the six default lists once, with the right list types', async () => {
    const { database, profile, wordListRepository } = await setUp();
    await createProfileRepository(database).ensureDefaultProfile();
    const summaries = await wordListRepository.listSummaries(profile.id);
    expect(summaries.map((summary) => summary.list.name)).toEqual([
      'General Vocabulary',
      'Focus Vocabulary',
      'Nouns',
      'Verbs',
      'Adjectives',
      'Phrases',
    ]);
    const verbs = summaries.find((summary) => summary.list.name === 'Verbs')?.list;
    expect(verbs).toBeInstanceOf(PartOfSpeechWordList);
  });

  it('stores a word once even when it is added to several lists', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const first = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    const second = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    expect(second.id).toBe(first.id);
    await wordListRepository.addWordToLists(first.id, [
      { wordListId: listIdByName('General Vocabulary') },
      { wordListId: listIdByName('Verbs') },
    ]);
    const summaries = await wordListRepository.listSummaries(profile.id);
    const lengths = Object.fromEntries(
      summaries.map((summary) => [summary.list.name, summary.length]),
    );
    expect(lengths['General Vocabulary']).toBe(1);
    expect(lengths.Verbs).toBe(1);
  });

  it('applies a "learned" downgrade to the word in every list', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const word = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    await wordListRepository.addWordToLists(word.id, [
      { wordListId: listIdByName('General Vocabulary') },
      { wordListId: listIdByName('Verbs') },
    ]);

    await wordRepository.markWordLearned(word.id);

    for (const listName of ['General Vocabulary', 'Verbs']) {
      const list = await wordListRepository.getListWithEntries(listIdByName(listName));
      expect(list?.words[0].word.frequencyTier).toBe(FrequencyTier.MemoryReinforcement);
    }
  });

  it('allows duplicate entries but practices each word once', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const generalListId = listIdByName('General Vocabulary');
    const word = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    await wordListRepository.addWordToLists(word.id, [{ wordListId: generalListId }]);
    await wordListRepository.addWordToLists(word.id, [{ wordListId: generalListId }]);
    const list = await wordListRepository.getListWithEntries(generalListId);
    expect(list?.length).toBe(2);
    expect(distinctPracticeCards(list?.words ?? [])).toHaveLength(1);
  });

  it('finds which selected lists already contain a character', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const word = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    await wordListRepository.addWordToLists(word.id, [{ wordListId: listIdByName('Verbs') }]);
    const containing = await wordListRepository.listIdsContainingCharacter(
      [listIdByName('Verbs'), listIdByName('Nouns')],
      '走',
    );
    expect(containing).toEqual([listIdByName('Verbs')]);
  });

  it('keeps per-list definition overrides separate from the word', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const word = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    await wordListRepository.addWordToLists(word.id, [
      { wordListId: listIdByName('Verbs') },
      { wordListId: listIdByName('Phrases') },
    ]);
    const verbs = await wordListRepository.getListWithEntries(listIdByName('Verbs'));
    const verbEntryId = verbs?.words[0].entryId ?? -1;
    await wordListRepository.setEntryDefinitions(verbEntryId, ['to go']);

    const updatedVerbs = await wordListRepository.getListWithEntries(listIdByName('Verbs'));
    const phrases = await wordListRepository.getListWithEntries(listIdByName('Phrases'));
    expect(updatedVerbs?.words[0].definitionsOverride).toEqual(['to go']);
    expect(phrases?.words[0].definitionsOverride).toBeUndefined();
  });

  it('removes an entry and recalculates length', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const generalListId = listIdByName('General Vocabulary');
    const word = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    await wordListRepository.addWordToLists(word.id, [{ wordListId: generalListId }]);
    const list = await wordListRepository.getListWithEntries(generalListId);
    await wordListRepository.removeEntry(list?.words[0].entryId ?? -1);
    expect((await wordListRepository.getListWithEntries(generalListId))?.length).toBe(0);
  });
});

describe('settings', () => {
  it('returns defaults, saves values and ignores invalid stored values', async () => {
    const { database, profile } = await setUp();
    const settingsRepository = createSettingsRepository(database);
    expect((await settingsRepository.loadSettings(profile.id)).phoneticDisplay).toBe(
      PhoneticDisplay.Pinyin,
    );
    await settingsRepository.saveSetting(profile.id, 'phoneticDisplay', PhoneticDisplay.Zhuyin);
    await database.run('INSERT INTO settings (profile_id, key, value) VALUES (?, ?, ?)', [
      profile.id,
      'defaultPracticeSetSize',
      '33',
    ]);
    const settings = await settingsRepository.loadSettings(profile.id);
    expect(settings.phoneticDisplay).toBe(PhoneticDisplay.Zhuyin);
    expect(settings.defaultPracticeSetSize).toBe(40);
  });
});
