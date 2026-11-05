import { DEFAULT_WORD_LISTS } from '../../domain/defaultWordLists';
import type { LanguageId } from '../../domain/language';
import { DEFAULT_LANGUAGE_ID, toLanguageId } from '../../domain/language';
import { WordListKind } from '../../domain/wordList';
import type { SqlDatabase } from '../sqlDatabase';

export const DEFAULT_PROFILE_NAME = 'Me';

export interface Profile {
  id: number;
  name: string;
  languageId: LanguageId;
}

interface ProfileRow {
  id: number;
  name: string;
  language_id: string;
}

function toProfile(row: ProfileRow): Profile {
  return { id: row.id, name: row.name, languageId: toLanguageId(row.language_id) };
}

export function createProfileRepository(database: SqlDatabase) {
  async function createProfile(name: string, languageId: LanguageId): Promise<Profile> {
    let profileId = 0;
    await database.transaction(async () => {
      const result = await database.run(
        'INSERT INTO profiles (name, language_id, created_at) VALUES (?, ?, ?)',
        [name, languageId, Date.now()],
      );
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
    return { id: profileId, name, languageId };
  }

  /** Returns the first profile, creating it (with the default lists) on first launch. */
  async function ensureDefaultProfile(): Promise<Profile> {
    const existing = await database.getFirst<ProfileRow>(
      'SELECT id, name, language_id FROM profiles ORDER BY id LIMIT 1',
    );
    return existing
      ? toProfile(existing)
      : createProfile(DEFAULT_PROFILE_NAME, DEFAULT_LANGUAGE_ID);
  }

  return { createProfile, ensureDefaultProfile };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
