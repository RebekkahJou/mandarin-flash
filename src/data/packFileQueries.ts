import type { PackFileKind } from './packSchema';
import type { SqlDatabase } from './sqlDatabase';

/** Names of a pack's files of one kind, e.g. its fonts. Names are checked by validation. */
export async function listPackFileNames(
  database: SqlDatabase,
  kind: PackFileKind,
): Promise<string[]> {
  const rows = await database.getAll<{ name: string }>(
    'SELECT name FROM pack_files WHERE kind = ? ORDER BY name',
    [kind],
  );
  return rows.map((row) => row.name);
}

/** One file's bytes, read only when it has to be written out. */
export async function readPackFileData(
  database: SqlDatabase,
  name: string,
): Promise<Uint8Array | null> {
  const row = await database.getFirst<{ data: Uint8Array }>(
    'SELECT data FROM pack_files WHERE name = ?',
    [name],
  );
  return row?.data ?? null;
}
