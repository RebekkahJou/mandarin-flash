/**
 * @jest-environment node
 */
import { FrequencyTier } from '../../domain/frequencyTier';
import { GeneralWordList } from '../../domain/generalWordList';
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

const walkWord = { headword: '走', reading: 'zou3', definitions: ['to walk'] };

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
    const containing = await wordListRepository.listIdsContainingHeadword(
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

  it('lists every word with each of its lists once, including words in no list', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const walk = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    const good = await wordRepository.findOrCreateWord({
      profileId: profile.id,
      headword: '好',
      reading: 'hao3',
      definitions: ['good'],
    });
    await wordListRepository.addWordToLists(walk.id, [
      { wordListId: listIdByName('Verbs') },
      { wordListId: listIdByName('Verbs') },
      { wordListId: listIdByName('General Vocabulary') },
    ]);

    const words = await wordRepository.listWordsWithListIds(profile.id);
    const listIdsByCharacter = Object.fromEntries(
      words.map(({ word, listIds }) => [word.headword, [...listIds].sort()]),
    );
    expect(listIdsByCharacter).toEqual({
      走: [listIdByName('General Vocabulary'), listIdByName('Verbs')].sort(),
      好: [],
    });
    expect(await wordRepository.countWords(profile.id)).toBe(2);
    expect(words.find(({ word }) => word.id === good.id)?.word.definitions).toEqual(['good']);
  });

  it('sets a word tier directly', async () => {
    const { profile, wordRepository } = await setUp();
    const word = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    await wordRepository.setFrequencyTier(word.id, FrequencyTier.Retention);
    expect((await wordRepository.getWord(word.id))?.frequencyTier).toBe(FrequencyTier.Retention);
  });

  it('removes a word from one list, duplicates included, and keeps the word', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const word = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    await wordListRepository.addWordToLists(word.id, [
      { wordListId: listIdByName('Verbs') },
      { wordListId: listIdByName('Verbs') },
      { wordListId: listIdByName('Phrases') },
    ]);

    await wordListRepository.removeWordFromList(word.id, listIdByName('Verbs'));

    expect(await wordListRepository.listIdsContainingWord(word.id)).toEqual([
      listIdByName('Phrases'),
    ]);
    expect(await wordRepository.getWord(word.id)).not.toBeNull();
  });

  it('adds a new general list after the existing ones', async () => {
    const { profile, wordListRepository } = await setUp();
    const newListId = await wordListRepository.createGeneralList(profile.id, 'Food');
    const summaries = await wordListRepository.listSummaries(profile.id);
    const lastSummary = summaries[summaries.length - 1];
    expect(lastSummary.list.id).toBe(newListId);
    expect(lastSummary.list).toBeInstanceOf(GeneralWordList);
    expect(lastSummary.length).toBe(0);
  });

  it('renames a list', async () => {
    const { profile, wordListRepository, listIdByName } = await setUp();
    await wordListRepository.renameList(listIdByName('Phrases'), 'Sayings');
    const list = await wordListRepository.getListWithEntries(listIdByName('Phrases'));
    expect(list?.name).toBe('Sayings');
    expect((await wordListRepository.listSummaries(profile.id)).length).toBe(6);
  });

  it('deletes a list and its entries but keeps the words', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const word = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    await wordListRepository.addWordToLists(word.id, [
      { wordListId: listIdByName('Verbs') },
      { wordListId: listIdByName('General Vocabulary') },
    ]);

    await wordListRepository.deleteList(listIdByName('Verbs'));

    const names = (await wordListRepository.listSummaries(profile.id)).map(({ list }) => list.name);
    expect(names).not.toContain('Verbs');
    expect(await wordListRepository.listIdsContainingWord(word.id)).toEqual([
      listIdByName('General Vocabulary'),
    ]);
    expect(await wordRepository.getWord(word.id)).not.toBeNull();
  });

  it('saves a new list order', async () => {
    const { profile, wordListRepository } = await setUp();
    const summaries = await wordListRepository.listSummaries(profile.id);
    const reversedIds = summaries.map(({ list }) => list.id).reverse();
    await wordListRepository.setListOrder(reversedIds);
    const reordered = await wordListRepository.listSummaries(profile.id);
    expect(reordered.map(({ list }) => list.id)).toEqual(reversedIds);
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
