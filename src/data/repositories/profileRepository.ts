import { defaultWordListsFor, listKindFor } from '../../domain/defaultWordLists';
import type { LanguageId } from '../../domain/language';
import { languageDefinitionFor, toLanguageId } from '../../domain/language';
import type { Profile } from '../../domain/profileGroups';
import { toProfileIcon } from '../../domain/profileIcons';
import type { SqlDatabase } from '../sqlDatabase';

interface ProfileRow {
  id: number;
  name: string;
  language_id: string;
  last_used_at: number;
  icon: string | null;
}

const PROFILE_COLUMNS = 'id, name, language_id, last_used_at, icon';

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    languageId: toLanguageId(row.language_id),
    lastUsedAtMs: row.last_used_at,
    icon: toProfileIcon(row.icon),
  };
}

/** A profile nobody has picked yet, so it doesn't decide which language the welcome screen opens on. */
const NEVER_USED_AT_MS = 0;

export function createProfileRepository(database: SqlDatabase) {
  async function createProfile(name: string, languageId: LanguageId): Promise<Profile> {
    let profileId = 0;
    const createdAtMs = Date.now();
    await database.transaction(async () => {
      const result = await database.run(
        'INSERT INTO profiles (name, language_id, created_at, last_used_at) VALUES (?, ?, ?, ?)',
        [name, languageId, createdAtMs, NEVER_USED_AT_MS],
      );
      profileId = result.lastInsertRowId;
      const { extraDefaultWordLists } = languageDefinitionFor(languageId);
      for (const [sortOrder, list] of defaultWordListsFor(extraDefaultWordLists).entries()) {
        await database.run(
          'INSERT INTO word_lists (profile_id, name, kind, part_of_speech, sort_order) VALUES (?, ?, ?, ?, ?)',
          [profileId, list.name, listKindFor(list), list.partOfSpeech ?? null, sortOrder],
        );
      }
    });
    return { id: profileId, name, languageId, lastUsedAtMs: NEVER_USED_AT_MS };
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

  async function renameProfile(profileId: number, name: string): Promise<void> {
    await database.run('UPDATE profiles SET name = ? WHERE id = ?', [name, profileId]);
  }

  /** One of PROFILE_ICONS, or null for no icon. */
  async function setProfileIcon(profileId: number, icon: string | null): Promise<void> {
    await database.run('UPDATE profiles SET icon = ? WHERE id = ?', [
      toProfileIcon(icon) ?? null,
      profileId,
    ]);
  }

  /** Foreign keys cascade, so the profile's lists, words, settings and history go with it. */
  async function deleteProfile(profileId: number): Promise<void> {
    await database.run('DELETE FROM profiles WHERE id = ?', [profileId]);
  }

  return {
    createProfile,
    listProfiles,
    markProfileUsed,
    renameProfile,
    setProfileIcon,
    deleteProfile,
  };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
