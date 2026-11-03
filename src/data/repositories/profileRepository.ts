import { DEFAULT_WORD_LISTS } from '../../domain/defaultWordLists';
import { WordListKind } from '../../domain/wordList';
import type { SqlDatabase } from '../sqlDatabase';

export const DEFAULT_PROFILE_NAME = 'Me';

export interface Profile {
  id: number;
  name: string;
}

export function createProfileRepository(database: SqlDatabase) {
  async function createProfile(name: string): Promise<Profile> {
    let profileId = 0;
    await database.transaction(async () => {
      const result = await database.run('INSERT INTO profiles (name, created_at) VALUES (?, ?)', [
        name,
        Date.now(),
      ]);
      profileId = result.lastInsertRowId;
      for (const [sortOrder, list] of DEFAULT_WORD_LISTS.entries()) {
        await database.run(
          'INSERT INTO word_lists (profile_id, name, kind, part_of_speech, sort_order) VALUES (?, ?, ?, ?, ?)',
          [
            profileId,
            list.name,
            list.partOfSpeech ? WordListKind.PartOfSpeech : WordListKind.General,
            list.partOfSpeech ?? null,
            sortOrder,
          ],
        );
      }
    });
    return { id: profileId, name };
  }

  /** Returns the first profile, creating it (with the default lists) on first launch. */
  async function ensureDefaultProfile(): Promise<Profile> {
    const existing = await database.getFirst<Profile>(
      'SELECT id, name FROM profiles ORDER BY id LIMIT 1',
    );
    return existing ?? createProfile(DEFAULT_PROFILE_NAME);
  }

  return { createProfile, ensureDefaultProfile };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
