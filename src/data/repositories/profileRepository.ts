import { DEFAULT_WORD_LISTS } from '../../domain/defaultWordLists';
import type { LanguageId } from '../../domain/language';
import { DEFAULT_LANGUAGE_ID, toLanguageId } from '../../domain/language';
import type { Profile } from '../../domain/profileGroups';
import { WordListKind } from '../../domain/wordList';
import type { SqlDatabase } from '../sqlDatabase';

export const DEFAULT_PROFILE_NAME = 'Me';

interface ProfileRow {
  id: number;
  name: string;
  language_id: string;
  last_used_at: number;
}

const PROFILE_COLUMNS = 'id, name, language_id, last_used_at';

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    languageId: toLanguageId(row.language_id),
    lastUsedAtMs: row.last_used_at,
  };
}

export function createProfileRepository(database: SqlDatabase) {
  async function createProfile(name: string, languageId: LanguageId): Promise<Profile> {
    let profileId = 0;
    const createdAtMs = Date.now();
    await database.transaction(async () => {
      const result = await database.run(
        'INSERT INTO profiles (name, language_id, created_at, last_used_at) VALUES (?, ?, ?, ?)',
        [name, languageId, createdAtMs, createdAtMs],
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
    return { id: profileId, name, languageId, lastUsedAtMs: createdAtMs };
  }

  async function listProfiles(): Promise<Profile[]> {
    const rows = await database.getAll<ProfileRow>(
      `SELECT ${PROFILE_COLUMNS} FROM profiles ORDER BY last_used_at DESC, id`,
    );
    return rows.map(toProfile);
  }

  /** Records that the user switched to this profile, so the welcome screen opens on it next. */
  async function markProfileUsed(profileId: number, usedAtMs: number): Promise<void> {
    await database.run('UPDATE profiles SET last_used_at = ? WHERE id = ?', [usedAtMs, profileId]);
  }

  /**
   * Returns the most recently used profile. Only the default profile is ever created
   * automatically, on first launch, with the default lists.
   */
  async function ensureDefaultProfile(): Promise<Profile> {
    const existing = await database.getFirst<ProfileRow>(
      `SELECT ${PROFILE_COLUMNS} FROM profiles ORDER BY last_used_at DESC, id LIMIT 1`,
    );
    return existing
      ? toProfile(existing)
      : createProfile(DEFAULT_PROFILE_NAME, DEFAULT_LANGUAGE_ID);
  }

  return { createProfile, listProfiles, markProfileUsed, ensureDefaultProfile };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
