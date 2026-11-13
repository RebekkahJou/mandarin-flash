/**
 * @jest-environment node
 */
import { migrateUserDatabase } from '../../data/migrations/userDatabaseMigrations';
import { createProfileRepository } from '../../data/repositories/profileRepository';
import { createReviewEventRepository } from '../../data/repositories/reviewEventRepository';
import { createSettingsRepository } from '../../data/repositories/settingsRepository';
import { createWordListRepository } from '../../data/repositories/wordListRepository';
import { createWordRepository } from '../../data/repositories/wordRepository';
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { INSERT_PACK_ENTRY_SQL, writeTestPack } from '../../data/testing/testPack';
import { FrequencyTier } from '../../domain/frequencyTier';
import { LanguageId } from '../../domain/language';
import { ReviewAnswer } from '../../domain/reviewEvent';
import type { DictionaryForm } from '../dictionaryLookup';
import { createDictionaryLookup } from '../dictionaryLookup';
import type { SavedReadingServices } from '../savedReadings';
import { updateSavedReadings } from '../savedReadings';

const TRADITIONAL: DictionaryForm = { readsVariants: false, convertSentence: (text) => text };
const SIMPLIFIED: DictionaryForm = { readsVariants: true, convertSentence: (text) => text };

async function setUp(form = TRADITIONAL) {
  const database = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).createProfile(
    'Me',
    LanguageId.MandarinTraditional,
  );
  const pack = createInMemoryDatabase();
  await writeTestPack(pack);
  await pack.run(INSERT_PACK_ENTRY_SQL, ['休息', '', 'xiu1 xi2', 'xiu1 xi5', '[["rest",2]]', -1]);
  await pack.run(INSERT_PACK_ENTRY_SQL, ['走', '', 'zou3', '', '[["walk",2]]', -1]);
  const wordRepository = createWordRepository(database);
  const wordListRepository = createWordListRepository(database);
  const services: SavedReadingServices = {
    profileId: profile.id,
    packVersionKey: 'mandarin:3',
    dictionaryLookup: createDictionaryLookup(pack, form, []),
    wordRepository,
    settingsRepository: createSettingsRepository(database),
  };
  const summaries = await wordListRepository.listSummaries(profile.id);
  const listId = (name: string) => summaries.find(({ list }) => list.name === name)?.list.id ?? 0;
  const saveWord = async (reading: string, listName: string, definitions = ['rest']) => {
    const word = await wordRepository.findOrCreateWord({
      profileId: profile.id,
      headword: '休息',
      reading,
      definitions,
    });
    await wordListRepository.addWordToLists(word.id, [{ wordListId: listId(listName) }]);
    return word;
  };
  return { database, services, wordRepository, wordListRepository, listId, saveWord };
}

describe('updateSavedReadings', () => {
  it('gives saved words the Taiwan reading, keeping their lists', async () => {
    const { services, wordRepository, wordListRepository, listId, saveWord } = await setUp();
    const rest = await saveWord('xiu1 xi5', 'Verbs');
    expect(await updateSavedReadings(services)).toBe(1);
    expect((await wordRepository.getWord(rest.id))?.reading).toBe('xiu1 xi2');
    const verbs = await wordListRepository.getListWithEntries(listId('Verbs'));
    expect(verbs?.words.map((entry) => entry.word.reading)).toEqual(['xiu1 xi2']);
  });

  it('runs once per pack version', async () => {
    const { services, wordRepository, saveWord } = await setUp();
    await updateSavedReadings(services);
    const later = await saveWord('xiu1 xi5', 'Verbs');
    expect(await updateSavedReadings(services)).toBe(0);
    expect((await wordRepository.getWord(later.id))?.reading).toBe('xiu1 xi5');
    expect(await updateSavedReadings({ ...services, packVersionKey: 'mandarin:4' })).toBe(1);
  });

  it('merges into a copy that already has the Taiwan reading', async () => {
    const { database, services, wordRepository, wordListRepository, listId, saveWord } =
      await setUp();
    const mainland = await saveWord('xiu1 xi5', 'Verbs', ['to rest']);
    await wordListRepository.addWordToLists(mainland.id, [
      { wordListId: listId('Focus Vocabulary') },
    ]);
    await wordRepository.assignStarterSet(mainland.id, 2);
    await createReviewEventRepository(database).recordReviewEvent({
      profileId: services.profileId,
      wordId: mainland.id,
      answer: ReviewAnswer.Gotten,
      answeredAtMs: 1,
    });
    const taiwan = await saveWord('xiu1 xi2', 'Verbs', ['rest']);
    await wordRepository.setFrequencyTier(taiwan.id, FrequencyTier.Retention);

    expect(await updateSavedReadings(services)).toBe(1);
    expect(await wordRepository.getWord(mainland.id)).toBeNull();
    const kept = await wordRepository.getWord(taiwan.id);
    expect(kept).toMatchObject({ definitions: ['rest'], frequencyTier: FrequencyTier.Retention });
    const verbs = await wordListRepository.getListWithEntries(listId('Verbs'));
    expect(verbs?.length).toBe(1);
    const focus = await wordListRepository.getListWithEntries(listId('Focus Vocabulary'));
    expect(focus?.words.map((entry) => entry.word.id)).toEqual([taiwan.id]);
    const events = await database.getAll<{ word_id: number }>('SELECT word_id FROM review_events');
    expect(events).toEqual([{ word_id: taiwan.id }]);
    const starter = await wordRepository.starterSetTierCounts(services.profileId);
    expect(starter).toEqual([
      { setNumber: 2, frequencyTier: FrequencyTier.Retention, wordCount: 1 },
    ]);
  });

  it('leaves Simplified profiles, which keep mainland readings', async () => {
    const { services, wordRepository, saveWord } = await setUp(SIMPLIFIED);
    const rest = await saveWord('xiu1 xi5', 'Verbs');
    expect(await updateSavedReadings(services)).toBe(0);
    expect((await wordRepository.getWord(rest.id))?.reading).toBe('xiu1 xi5');
  });
});
