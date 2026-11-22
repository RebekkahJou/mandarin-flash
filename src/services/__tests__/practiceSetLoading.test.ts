/**
 * @jest-environment node
 */
import { migrateUserDatabase } from '../../data/migrations/userDatabaseMigrations';
import { createPracticeSessionRepository } from '../../data/repositories/practiceSessionRepository';
import { createProfileRepository } from '../../data/repositories/profileRepository';
import { createWordListRepository } from '../../data/repositories/wordListRepository';
import { createWordRepository } from '../../data/repositories/wordRepository';
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { LanguageId } from '../../domain/language';
import { PracticeSession } from '../../domain/practiceSession';
import { SessionTimer } from '../../domain/sessionTimer';
import { PracticeStart, loadPracticeSet } from '../practiceSetLoading';

async function setUp() {
  const database = createInMemoryDatabase();
  await migrateUserDatabase(database);
  const profile = await createProfileRepository(database).createProfile(
    'Me',
    LanguageId.MandarinTraditional,
  );
  const wordRepository = createWordRepository(database);
  const wordListRepository = createWordListRepository(database);
  const practiceSessionRepository = createPracticeSessionRepository(database);
  const summaries = await wordListRepository.listSummaries(profile.id);
  const verbsId = summaries.find(({ list }) => list.name === 'Verbs')?.list.id ?? 0;
  const wordIds: number[] = [];
  for (const headword of ['走', '跑', '吃']) {
    const word = await wordRepository.findOrCreateWord({
      profileId: profile.id,
      headword,
      reading: 'zi4',
      definitions: [headword],
    });
    await wordListRepository.addWordToLists(word.id, [{ wordListId: verbsId }]);
    wordIds.push(word.id);
  }
  const sources = { wordListRepository, wordRepository, practiceSessionRepository };
  return { profile, sources, wordIds, verbsId, wordListRepository, wordRepository };
}

describe('loadPracticeSet', () => {
  it('resumes the paused set, keeping words that left the list and dropping deleted ones', async () => {
    const { profile, sources, wordIds, verbsId, wordListRepository, wordRepository } =
      await setUp();
    const session = new PracticeSession(wordIds, () => 0);
    session.markGotten();
    await sources.practiceSessionRepository.savePausedSet(profile.id, {
      wordListId: verbsId,
      setSize: 20,
      state: {
        session: session.toSnapshot(),
        timer: new SessionTimer(() => 0).toSnapshot(),
        isSavedSet: true,
      },
    });
    await wordListRepository.removeWordFromList(wordIds[1], verbsId);
    await wordRepository.deleteWords([wordIds[2]]);

    const loaded = await loadPracticeSet(sources, verbsId, 20, PracticeStart.Resume);

    expect(loaded.session.cardCount).toBe(2);
    expect(loaded.session.completedCardCount).toBe(1);
    expect(loaded.cardsByWordId.get(wordIds[1])?.definitions).toEqual(['跑']);
    expect(loaded.isSavedSet).toBe(true);
  });

  it('starts the saved set with all its words', async () => {
    const { profile, sources, wordIds, verbsId } = await setUp();
    await sources.practiceSessionRepository.saveSavedSet(profile.id, verbsId, wordIds.slice(0, 2));
    const loaded = await loadPracticeSet(sources, verbsId, 40, PracticeStart.Saved);
    expect(loaded.session.toSnapshot().wordIds.sort()).toEqual(wordIds.slice(0, 2).sort());
    expect(loaded.isSavedSet).toBe(true);
  });

  it('draws a new set when there is no paused or saved set', async () => {
    const { sources, verbsId } = await setUp();
    const loaded = await loadPracticeSet(sources, verbsId, 20, PracticeStart.Saved);
    expect(loaded.session.cardCount).toBe(3);
    expect(loaded.isSavedSet).toBe(false);
  });
});
