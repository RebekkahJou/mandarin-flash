/**
 * @jest-environment node
 */
import { ComponentsWordList } from '../../domain/componentsWordList';
import { FrequencyTier } from '../../domain/frequencyTier';
import { GeneralWordList } from '../../domain/generalWordList';
import { LanguageId } from '../../domain/language';
import { PartOfSpeech } from '../../domain/partOfSpeech';
import { distinctPracticeCards } from '../../domain/practiceCard';
import { PartOfSpeechWordList } from '../../domain/partOfSpeechWordList';
import { ReviewAnswer } from '../../domain/reviewEvent';
import { migrateUserDatabase } from '../migrations/userDatabaseMigrations';
import { createInstalledPackRepository } from '../repositories/installedPackRepository';
import { createProfileRepository } from '../repositories/profileRepository';
import { createReviewEventRepository } from '../repositories/reviewEventRepository';
import { PhoneticDisplay, createSettingsRepository } from '../repositories/settingsRepository';
import { createWordListRepository } from '../repositories/wordListRepository';
import { createWordRepository } from '../repositories/wordRepository';
import type { SqlDatabase } from '../sqlDatabase';
import { createInMemoryDatabase } from '../testing/nodeSqlDatabase';

async function setUp() {
  const database: SqlDatabase = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).createProfile(
    'Me',
    LanguageId.MandarinTraditional,
  );
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

  it("creates the default lists plus the language's own, with the right list types", async () => {
    const { profile, wordListRepository } = await setUp();
    const summaries = await wordListRepository.listSummaries(profile.id);
    expect(summaries.map((summary) => summary.list.name)).toEqual([
      'General Vocabulary',
      'Focus Vocabulary',
      'Nouns',
      'Verbs',
      'Adjectives',
      'Adverbs',
      'Phrases',
      'Measure words',
      'Components',
    ]);
    const verbs = summaries.find((summary) => summary.list.name === 'Verbs')?.list;
    expect(verbs).toBeInstanceOf(PartOfSpeechWordList);
    const components = summaries.find((summary) => summary.list.name === 'Components')?.list;
    expect(components).toBeInstanceOf(ComponentsWordList);
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

  it('lists a word with every meaning its lists show, its own first', async () => {
    const { profile, wordRepository, wordListRepository, listIdByName } = await setUp();
    const car = await wordRepository.findOrCreateWord({
      profileId: profile.id,
      headword: '車',
      reading: 'che1',
      definitions: ['car', 'vehicle', 'machine'],
    });
    await wordListRepository.addWordToLists(car.id, [
      { wordListId: listIdByName('General Vocabulary') },
      { wordListId: listIdByName('Verbs'), definitionsOverride: ['to shape with a lathe'] },
      { wordListId: listIdByName('Nouns'), definitionsOverride: ['car', 'vehicle'] },
    ]);

    const [listed] = await wordRepository.listWordsWithListIds(profile.id);
    expect(listed.meanings).toEqual(['car', 'vehicle', 'machine', 'to shape with a lathe']);
    expect(listed.word.definitions).toEqual(['car', 'vehicle', 'machine']);
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
    const newListId = await wordListRepository.createList(profile.id, { name: 'Food' });
    const summaries = await wordListRepository.listSummaries(profile.id);
    const lastSummary = summaries[summaries.length - 1];
    expect(lastSummary.list.id).toBe(newListId);
    expect(lastSummary.list).toBeInstanceOf(GeneralWordList);
    expect(lastSummary.length).toBe(0);
  });

  it('creates a suggested list with its part of speech', async () => {
    const { profile, wordListRepository } = await setUp();
    const listId = await wordListRepository.createList(profile.id, {
      name: 'Pronouns',
      partOfSpeech: PartOfSpeech.Pronoun,
    });
    const list = await wordListRepository.getListWithEntries(listId);
    expect(list).toBeInstanceOf(PartOfSpeechWordList);
  });

  it('renames a list', async () => {
    const { profile, wordListRepository, listIdByName } = await setUp();
    await wordListRepository.renameList(listIdByName('Phrases'), 'Sayings');
    const list = await wordListRepository.getListWithEntries(listIdByName('Phrases'));
    expect(list?.name).toBe('Sayings');
    expect((await wordListRepository.listSummaries(profile.id)).length).toBe(9);
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

describe('profiles', () => {
  it('stores the language a profile is created with', async () => {
    const database = createInMemoryDatabase();
    await migrateUserDatabase(database);
    const created = await createProfileRepository(database).createProfile(
      'Kid',
      LanguageId.MandarinSimplified,
    );
    const stored = await database.getFirst<{ language_id: string }>(
      'SELECT language_id FROM profiles WHERE id = ?',
      [created.id],
    );
    expect(stored?.language_id).toBe(LanguageId.MandarinSimplified);
  });

  it('reads an unknown stored language as the default language', async () => {
    const { database, profile } = await setUp();
    await database.run('UPDATE profiles SET language_id = ? WHERE id = ?', ['xx', profile.id]);
    const [reloaded] = await createProfileRepository(database).listProfiles();
    expect(reloaded).toMatchObject({
      id: profile.id,
      name: 'Me',
      languageId: LanguageId.MandarinTraditional,
    });
  });

  it('lists profiles most recently used first', async () => {
    const { database, profile } = await setUp();
    const profileRepository = createProfileRepository(database);
    const kid = await profileRepository.createProfile('Kid', LanguageId.MandarinTraditional);
    await profileRepository.markProfileUsed(profile.id, kid.lastUsedAtMs + 1);

    const listed = await profileRepository.listProfiles();
    expect(listed.map(({ name }) => name)).toEqual(['Me', 'Kid']);
    expect(listed[0].lastUsedAtMs).toBe(kid.lastUsedAtMs + 1);
  });

  it('starts a new profile as never used, after profiles someone has picked', async () => {
    const { database, profile } = await setUp();
    const profileRepository = createProfileRepository(database);
    await profileRepository.markProfileUsed(profile.id, 1000);
    const kid = await profileRepository.createProfile('Kid', LanguageId.MandarinSimplified);
    expect(kid.lastUsedAtMs).toBe(0);
    expect((await profileRepository.listProfiles()).map(({ name }) => name)).toEqual(['Me', 'Kid']);
  });

  it('renames a profile', async () => {
    const { database, profile } = await setUp();
    const profileRepository = createProfileRepository(database);
    await profileRepository.renameProfile(profile.id, 'Rebekkah');
    expect((await profileRepository.listProfiles())[0].name).toBe('Rebekkah');
  });

  it('deletes a profile with its lists and words, leaving other profiles alone', async () => {
    const { database, profile, wordRepository, wordListRepository } = await setUp();
    const profileRepository = createProfileRepository(database);
    const kid = await profileRepository.createProfile('Kid', LanguageId.MandarinTraditional);
    await wordRepository.findOrCreateWord({ profileId: kid.id, ...walkWord });
    await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });

    await profileRepository.deleteProfile(kid.id);
    expect((await profileRepository.listProfiles()).map(({ id }) => id)).toEqual([profile.id]);
    expect(await wordRepository.countWords(kid.id)).toBe(0);
    expect(await wordListRepository.listSummaries(kid.id)).toEqual([]);
    expect(await wordRepository.countWords(profile.id)).toBe(1);
  });

  it('gives a new profile its own default lists', async () => {
    const { database, wordListRepository } = await setUp();
    const kid = await createProfileRepository(database).createProfile(
      'Kid',
      LanguageId.MandarinTraditional,
    );
    const summaries = await wordListRepository.listSummaries(kid.id);
    expect(summaries.map((summary) => summary.list.name)).toContain('General Vocabulary');
    expect(summaries.every((summary) => summary.list.profileId === kid.id)).toBe(true);
  });
});

describe('review events', () => {
  it('records each answer in order with its time', async () => {
    const { database, profile, wordRepository } = await setUp();
    const word = await wordRepository.findOrCreateWord({ profileId: profile.id, ...walkWord });
    const reviewEventRepository = createReviewEventRepository(database);
    const answers = [ReviewAnswer.Missed, ReviewAnswer.Gotten, ReviewAnswer.Learned];
    for (const [index, answer] of answers.entries()) {
      await reviewEventRepository.recordReviewEvent({
        profileId: profile.id,
        wordId: word.id,
        answer,
        answeredAtMs: 1000 + index,
      });
    }
    const rows = await database.getAll(
      'SELECT word_id, answer, answered_at FROM review_events ORDER BY id',
    );
    expect(rows).toEqual([
      { word_id: word.id, answer: 'missed', answered_at: 1000 },
      { word_id: word.id, answer: 'gotten', answered_at: 1001 },
      { word_id: word.id, answer: 'learned', answered_at: 1002 },
    ]);
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

describe('installed packs', () => {
  it('records a pack, replaces an older version and removes it', async () => {
    const { database } = await setUp();
    const repository = createInstalledPackRepository(database);
    const record = {
      packId: 'mandarin',
      packVersion: 2,
      databaseName: 'pack-mandarin-v2.db',
      installedAtMs: 10,
    };
    await repository.saveInstalledPack(record);
    await repository.saveInstalledPack({
      ...record,
      packVersion: 3,
      databaseName: 'pack-mandarin-v3.db',
    });
    expect(await repository.listInstalledPacks()).toEqual([
      { ...record, packVersion: 3, databaseName: 'pack-mandarin-v3.db' },
    ]);
    await repository.removeInstalledPack('mandarin');
    expect(await repository.listInstalledPacks()).toEqual([]);
  });
});
