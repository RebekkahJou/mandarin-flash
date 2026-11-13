import type { SqlDatabase } from '../sqlDatabase';

/** Which topic word sets each profile added from a language pack. */
export function createWordSetRepository(database: SqlDatabase) {
  async function addedSetIds(profileId: number, packId: string): Promise<Set<string>> {
    const rows = await database.getAll<{ set_id: string }>(
      'SELECT set_id FROM added_word_sets WHERE profile_id = ? AND pack_id = ?',
      [profileId, packId],
    );
    return new Set(rows.map((row) => row.set_id));
  }

  /** A set added again keeps its first time. */
  async function recordAddedSets(
    profileId: number,
    packId: string,
    setIds: readonly string[],
  ): Promise<void> {
    await database.transaction(async () => {
      for (const setId of setIds) {
        await database.run(
          'INSERT OR IGNORE INTO added_word_sets (profile_id, pack_id, set_id, added_at) VALUES (?, ?, ?, ?)',
          [profileId, packId, setId, Date.now()],
        );
      }
    });
  }

  return { addedSetIds, recordAddedSets };
}

export type WordSetRepository = ReturnType<typeof createWordSetRepository>;
