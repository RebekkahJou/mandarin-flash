/**
 * @jest-environment node
 */
import { migrateUserDatabase } from '../../data/migrations/userDatabaseMigrations';
import { createProfileRepository } from '../../data/repositories/profileRepository';
import { createWordListRepository } from '../../data/repositories/wordListRepository';
import { createWordRepository } from '../../data/repositories/wordRepository';
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { LanguageId } from '../../domain/language';
import { WordListKind } from '../../domain/wordList';
import type { ComponentsListServices } from '../componentsList';
import { fillPendingComponentLists } from '../componentsList';
import type { CharacterComponent } from '../dictionaryLookup';

const WATER: CharacterComponent = {
  component: '氵',
  name: '三點水',
  reading: 'san1 dian3 shui3',
  meaning: 'water',
};
const SPEECH: CharacterComponent = {
  component: '言',
  variant: '讠',
  name: '言字旁',
  reading: 'yan2 zi4 pang2',
  meaning: 'speech',
};

async function setUp(components: CharacterComponent[]) {
  const database = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).createProfile(
    'Me',
    LanguageId.MandarinTraditional,
  );
  const services: ComponentsListServices = {
    profileId: profile.id,
    dictionaryLookup: { components: async () => components },
    wordRepository: createWordRepository(database),
    wordListRepository: createWordListRepository(database),
  };
  return services;
}

async function componentsList(services: ComponentsListServices) {
  const summaries = await services.wordListRepository.listSummaries(services.profileId);
  const summary = summaries.find(({ list }) => list.kind === WordListKind.Components);
  return services.wordListRepository.getListWithEntries(summary?.list.id ?? 0);
}

describe('fillPendingComponentLists', () => {
  it("fills a new Mandarin profile's Components list with meanings and names", async () => {
    const services = await setUp([WATER, SPEECH]);
    await fillPendingComponentLists(services);
    const list = await componentsList(services);
    expect(list?.words.map((entry) => [entry.word.headword, entry.word.definitions])).toEqual(
      expect.arrayContaining([
        ['氵', ['water', '三點水']],
        ['言', ['speech', '言字旁']],
      ]),
    );
    expect(list?.words.find((entry) => entry.word.headword === '言')?.word.variant).toBe('讠');
  });

  it('fills a list only once, even when emptied or asked twice at the same time', async () => {
    const services = await setUp([WATER]);
    await Promise.all([fillPendingComponentLists(services), fillPendingComponentLists(services)]);
    expect((await componentsList(services))?.length).toBe(1);
    const list = await componentsList(services);
    await services.wordListRepository.removeEntry(list?.words[0].entryId ?? 0);
    await fillPendingComponentLists(services);
    expect((await componentsList(services))?.length).toBe(0);
  });

  it('waits for a pack with components before filling', async () => {
    const services = await setUp([]);
    await fillPendingComponentLists(services);
    const withComponents = { ...services, dictionaryLookup: { components: async () => [WATER] } };
    await fillPendingComponentLists(withComponents);
    expect((await componentsList(services))?.length).toBe(1);
  });
});
