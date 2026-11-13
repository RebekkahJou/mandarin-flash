/**
 * @jest-environment node
 */
import { migrateUserDatabase } from '../../data/migrations/userDatabaseMigrations';
import { createProfileRepository } from '../../data/repositories/profileRepository';
import { createWordListRepository } from '../../data/repositories/wordListRepository';
import { createWordRepository } from '../../data/repositories/wordRepository';
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { ComponentsWordList } from '../../domain/componentsWordList';
import { FrequencyTier } from '../../domain/frequencyTier';
import { GeneralWordList } from '../../domain/generalWordList';
import { LanguageId } from '../../domain/language';
import {
  canHideList,
  hideStudyList,
  retentionQuestion,
  showHiddenListNamed,
} from '../studyListHiding';

async function setUp() {
  const database = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).createProfile(
    'Me',
    LanguageId.MandarinTraditional,
  );
  const services = {
    wordRepository: createWordRepository(database),
    wordListRepository: createWordListRepository(database),
  };
  const summaries = await services.wordListRepository.listSummaries(profile.id);
  const componentsId = summaries.find(({ list }) => list.name === 'Components')?.list.id ?? 0;
  const water = await services.wordRepository.findOrCreateWord({
    profileId: profile.id,
    headword: '氵',
    reading: 'san1 dian3 shui3',
    definitions: ['water', '三點水'],
  });
  await services.wordListRepository.addWordToLists(water.id, [{ wordListId: componentsId }]);
  return { profileId: profile.id, services, componentsId, water };
}

describe('hiding study lists', () => {
  it('asks about moving cards to Retention, saying levels are not restored', () => {
    const question = retentionQuestion('zhuyin cards');
    expect(question.title).toBe('Move all zhuyin cards to Retention?');
    expect(question.message).toContain("won't move them back");
    expect(retentionQuestion('components', 'Show it again from +.').message).toMatch(
      /screen\. Show it again from \+\.$/,
    );
  });

  it('lets only the Components list be hidden from its screen', () => {
    expect(canHideList(new ComponentsWordList({ id: 1, profileId: 1, name: 'Components' }))).toBe(
      true,
    );
    expect(canHideList(new GeneralWordList({ id: 2, profileId: 1, name: 'Phrases' }))).toBe(false);
  });

  it('hides the list and moves its cards to Retention when asked', async () => {
    const { profileId, services, componentsId, water } = await setUp();
    await hideStudyList(services, componentsId, true);
    const summaries = await services.wordListRepository.listSummaries(profileId);
    expect(summaries.some(({ list }) => list.id === componentsId)).toBe(false);
    expect((await services.wordRepository.getWord(water.id))?.frequencyTier).toBe(
      FrequencyTier.Retention,
    );
  });

  it('keeps levels when not asked to move them', async () => {
    const { services, componentsId, water } = await setUp();
    await hideStudyList(services, componentsId, false);
    expect((await services.wordRepository.getWord(water.id))?.frequencyTier).toBe(
      FrequencyTier.HighIncidence,
    );
  });

  it('shows the hidden list again by name, with its cards', async () => {
    const { profileId, services, componentsId } = await setUp();
    await hideStudyList(services, componentsId, false);
    expect(await showHiddenListNamed(services.wordListRepository, profileId, 'Components')).toBe(
      true,
    );
    const summaries = await services.wordListRepository.listSummaries(profileId);
    expect(summaries.find(({ list }) => list.id === componentsId)?.length).toBe(1);
    expect(await showHiddenListNamed(services.wordListRepository, profileId, 'Pronouns')).toBe(
      false,
    );
  });
});
