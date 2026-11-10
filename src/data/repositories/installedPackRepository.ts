import type { SqlDatabase } from '../sqlDatabase';

/** A pack the user installed; its database file sits in app storage under databaseName. */
export interface InstalledPackRecord {
  packId: string;
  packVersion: number;
  databaseName: string;
  installedAtMs: number;
}

interface InstalledPackRow {
  pack_id: string;
  pack_version: number;
  database_name: string;
  installed_at: number;
}

export function createInstalledPackRepository(database: SqlDatabase) {
  async function listInstalledPacks(): Promise<InstalledPackRecord[]> {
    const rows = await database.getAll<InstalledPackRow>(
      'SELECT pack_id, pack_version, database_name, installed_at FROM installed_packs ORDER BY pack_id',
    );
    return rows.map((row) => ({
      packId: row.pack_id,
      packVersion: row.pack_version,
      databaseName: row.database_name,
      installedAtMs: row.installed_at,
    }));
  }

  /** Records an installed pack, replacing the record of an older version of the same pack. */
  async function saveInstalledPack(record: InstalledPackRecord): Promise<void> {
    await database.run(
      `INSERT INTO installed_packs (pack_id, pack_version, database_name, installed_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (pack_id) DO UPDATE SET pack_version = excluded.pack_version,
         database_name = excluded.database_name, installed_at = excluded.installed_at`,
      [record.packId, record.packVersion, record.databaseName, record.installedAtMs],
    );
  }

  async function removeInstalledPack(packId: string): Promise<void> {
    await database.run('DELETE FROM installed_packs WHERE pack_id = ?', [packId]);
  }

  return { listInstalledPacks, saveInstalledPack, removeInstalledPack };
}

export type InstalledPackRepository = ReturnType<typeof createInstalledPackRepository>;
