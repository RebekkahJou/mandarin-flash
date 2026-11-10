/**
 * @jest-environment node
 */
import { migrateUserDatabase } from '../../data/migrations/userDatabaseMigrations';
import { createProfileRepository } from '../../data/repositories/profileRepository';
import { PhoneticDisplay } from '../../data/repositories/settingsRepository';
import { createWordListRepository } from '../../data/repositories/wordListRepository';
import { createWordRepository } from '../../data/repositories/wordRepository';
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { FrequencyTier } from '../../domain/frequencyTier';
import { LanguageId } from '../../domain/language';
import { ZHUYIN_STUDY_CARDS, zhuyinStudyWords } from '../languages/zhuyinStudyCards';
import { toZhuyin } from '../pinyin';
import type { ScriptStudyListServices } from '../scriptStudyList';
import {
  isZhuyinStudyOffered,
  shouldShowZhuyinList,
  syncZhuyinStudyList,
} from '../scriptStudyList';

async function setUp() {
  const database = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).createProfile(
    'Me',
    LanguageId.MandarinTraditional,
  );
  const services: ScriptStudyListServices = {
    profileId: profile.id,
    convertToScript: (text) => text,
    formatReading: (reading) => `[${reading}]`,
    wordRepository: createWordRepository(database),
    wordListRepository: createWordListRepository(database),
  };
  return services;
}

async function zhuyinList(services: ScriptStudyListServices) {
  const summaries = await services.wordListRepository.listSummaries(services.profileId);
  return summaries.find(({ list }) => list.name === 'Zhuyin');
}

describe('zhuyin study cards', () => {
  it('has the 37 symbols and 5 tone marks, each used in its example', () => {
    expect(ZHUYIN_STUDY_CARDS).toHaveLength(42);
    for (const card of ZHUYIN_STUDY_CARDS.slice(0, 37)) {
      expect(toZhuyin(card.exampleReading)).toContain(card.symbol);
    }
  });

  it('gives each card its sound and an example in the profile script', () => {
    const simplified = (text: string) => text.replace('媽', '妈');
    const [, , mother] = zhuyinStudyWords(simplified, (reading) => `[${reading}]`);
    expect(mother).toEqual({
      headword: 'ㄇ',
      reading: 'ma1',
      definitions: ['m', 'as in 妈 [ma1]'],
    });
  });
});

describe('Learn zhuyin', () => {
  it('is offered unless pronunciation is shown as zhuyin alone', () => {
    expect(isZhuyinStudyOffered(PhoneticDisplay.Pinyin)).toBe(true);
    expect(isZhuyinStudyOffered(PhoneticDisplay.Both)).toBe(true);
    expect(isZhuyinStudyOffered(PhoneticDisplay.Zhuyin)).toBe(false);
    expect(shouldShowZhuyinList(true, PhoneticDisplay.Zhuyin)).toBe(false);
    expect(shouldShowZhuyinList(true, PhoneticDisplay.Pinyin)).toBe(true);
  });

  it('creates and fills the Zhuyin list when turned on', async () => {
    const services = await setUp();
    await syncZhuyinStudyList(services, false);
    expect(await zhuyinList(services)).toBeUndefined();
    await syncZhuyinStudyList(services, true);
    expect((await zhuyinList(services))?.length).toBe(42);
  });

  it('hides the list when turned off and keeps its progress for when it returns', async () => {
    const services = await setUp();
    await syncZhuyinStudyList(services, true);
    const listId = (await zhuyinList(services))?.list.id ?? 0;
    const list = await services.wordListRepository.getListWithEntries(listId);
    const firstWord = list?.words[0].word;
    await services.wordRepository.setFrequencyTier(firstWord?.id ?? 0, FrequencyTier.Retention);
    await syncZhuyinStudyList(services, false);
    expect(await zhuyinList(services)).toBeUndefined();
    await syncZhuyinStudyList(services, true);
    expect((await zhuyinList(services))?.length).toBe(42);
    const word = await services.wordRepository.getWord(firstWord?.id ?? 0);
    expect(word?.frequencyTier).toBe(FrequencyTier.Retention);
  });
});
