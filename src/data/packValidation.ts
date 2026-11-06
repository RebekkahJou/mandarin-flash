import type { PackMetadata } from '../domain/packMetadata';
import { PackRejectedError, parsePackMetadata } from '../domain/packMetadata';
import {
  MIN_SUPPORTED_PACK_SCHEMA_VERSION,
  PACK_FORMAT_NAME,
  PACK_INDEX_NAMES,
  PACK_SCHEMA_VERSION,
  PACK_TABLE_COLUMNS,
} from './packSchema';
import type { SqlDatabase } from './sqlDatabase';

/** Limits generous enough for any real pack, small enough that a bad one can't swamp the phone. */
export const PACK_LIMITS = {
  maxEntries: 600_000,
  maxSentences: 200_000,
  maxStarterWords: 1_000,
  maxFiles: 20,
  maxHeadwordLength: 100,
  maxReadingLength: 300,
  maxGlossesLength: 20_000,
  maxSentenceLength: 1_000,
  maxFileNameLength: 80,
  maxFileBytes: 20 * 1024 * 1024,
} as const;

const DAMAGED_PACK_MESSAGE = 'This language pack is damaged. Download it again.';
const NEWER_SCHEMA_MESSAGE =
  'This language pack needs a newer version of the app. Update the app first.';
const OLDER_SCHEMA_MESSAGE = 'This language pack is too old for this version of the app.';

/** SQLite's own bookkeeping objects, which any database may contain. */
const SQLITE_INTERNAL_PREFIX = 'sqlite_';

function reject(message = DAMAGED_PACK_MESSAGE): never {
  throw new PackRejectedError(message);
}

/** Only the expected tables and indexes; a view or trigger could run unexpected SQL. */
async function checkSchemaObjects(database: SqlDatabase): Promise<void> {
  const objects = await database.getAll<{ type: string; name: string }>(
    'SELECT type, name FROM sqlite_master',
  );
  const expectedTables = new Set(Object.keys(PACK_TABLE_COLUMNS));
  const expectedIndexes = new Set(PACK_INDEX_NAMES);
  for (const { type, name } of objects) {
    if (name.startsWith(SQLITE_INTERNAL_PREFIX)) continue;
    const isExpected =
      (type === 'table' && expectedTables.has(name)) ||
      (type === 'index' && expectedIndexes.has(name));
    if (!isExpected) reject();
  }
}

async function checkColumns(database: SqlDatabase): Promise<void> {
  for (const [table, expectedColumns] of Object.entries(PACK_TABLE_COLUMNS)) {
    const rows = await database.getAll<{ name: string }>('SELECT name FROM pragma_table_info(?)', [
      table,
    ]);
    const columns = new Set(rows.map((row) => row.name));
    if (!expectedColumns.every((column) => columns.has(column))) reject();
  }
}

/** Reads and checks pack_metadata; also used alone for the built-in pack, which is trusted. */
export async function readPackMetadata(database: SqlDatabase): Promise<PackMetadata> {
  const rows = await database.getAll<{ key: unknown; value: unknown }>(
    'SELECT key, value FROM pack_metadata',
  );
  const values = new Map<string, string>();
  for (const { key, value } of rows) {
    if (typeof key !== 'string' || typeof value !== 'string') reject();
    values.set(key, value);
  }
  const metadata = parsePackMetadata(values, PACK_FORMAT_NAME);
  if (metadata.schemaVersion > PACK_SCHEMA_VERSION) reject(NEWER_SCHEMA_MESSAGE);
  if (metadata.schemaVersion < MIN_SUPPORTED_PACK_SCHEMA_VERSION) reject(OLDER_SCHEMA_MESSAGE);
  return metadata;
}

async function countRows(database: SqlDatabase, table: string): Promise<number> {
  // Table names come from PACK_TABLE_COLUMNS, never from the pack, so interpolating is safe.
  const row = await database.getFirst<{ row_count: number }>(
    `SELECT COUNT(*) AS row_count FROM ${table}`,
  );
  return row?.row_count ?? 0;
}

async function checkRowCounts(database: SqlDatabase): Promise<void> {
  const limits: [table: string, maxRows: number][] = [
    ['entries', PACK_LIMITS.maxEntries],
    ['sentences', PACK_LIMITS.maxSentences],
    ['starter_words', PACK_LIMITS.maxStarterWords],
    ['pack_files', PACK_LIMITS.maxFiles],
  ];
  for (const [table, maxRows] of limits) {
    if ((await countRows(database, table)) > maxRows) reject();
  }
}

async function hasAnyRow(database: SqlDatabase, sql: string, params: number[]): Promise<boolean> {
  return (await database.getFirst(sql, params)) !== null;
}

/**
 * Every text value must really be text and within its length limit, and every rank an integer.
 * SQLite doesn't enforce column types, so a pack could otherwise hold blobs or huge strings.
 */
async function checkValues(database: SqlDatabase): Promise<void> {
  const badRowQueries: [sql: string, params: number[]][] = [
    [
      `SELECT 1 FROM entries WHERE typeof(headword) <> 'text' OR typeof(variant) <> 'text'
         OR typeof(reading) <> 'text' OR typeof(variant_reading) <> 'text'
         OR typeof(glosses) <> 'text' OR typeof(rank) <> 'integer'
         OR length(headword) NOT BETWEEN 1 AND ? OR length(variant) > ?
         OR length(reading) > ? OR length(variant_reading) > ? OR length(glosses) > ? LIMIT 1`,
      [
        PACK_LIMITS.maxHeadwordLength,
        PACK_LIMITS.maxHeadwordLength,
        PACK_LIMITS.maxReadingLength,
        PACK_LIMITS.maxReadingLength,
        PACK_LIMITS.maxGlossesLength,
      ],
    ],
    [
      `SELECT 1 FROM sentences WHERE typeof(text) <> 'text' OR typeof(english) <> 'text'
         OR length(text) > ? OR length(english) > ? LIMIT 1`,
      [PACK_LIMITS.maxSentenceLength, PACK_LIMITS.maxSentenceLength],
    ],
    [
      `SELECT 1 FROM starter_words WHERE typeof(set_number) <> 'integer'
         OR typeof(position) <> 'integer' OR typeof(headword) <> 'text'
         OR typeof(reading) <> 'text' OR typeof(part_of_speech) <> 'text'
         OR length(headword) NOT BETWEEN 1 AND ? OR length(reading) > ? LIMIT 1`,
      [PACK_LIMITS.maxHeadwordLength, PACK_LIMITS.maxReadingLength],
    ],
    [
      `SELECT 1 FROM pack_files WHERE typeof(name) <> 'text' OR typeof(kind) <> 'text'
         OR typeof(data) <> 'blob' OR length(name) > ? OR length(data) > ? LIMIT 1`,
      [PACK_LIMITS.maxFileNameLength, PACK_LIMITS.maxFileBytes],
    ],
  ];
  for (const [sql, params] of badRowQueries) {
    if (await hasAnyRow(database, sql, params)) reject();
  }
}

async function checkIntegrity(database: SqlDatabase): Promise<void> {
  const result = await database.getFirst<{ quick_check: string }>('PRAGMA quick_check');
  if (result?.quick_check !== 'ok') reject();
}

/**
 * Checks an opened pack before the app uses it, and returns its metadata. Run on every pack
 * that didn't ship inside the app, after its signature has been verified: the signature proves
 * who made the file, this proves the app can read it safely.
 */
export async function validatePackDatabase(database: SqlDatabase): Promise<PackMetadata> {
  try {
    await checkIntegrity(database);
    await checkSchemaObjects(database);
    await checkColumns(database);
    const metadata = await readPackMetadata(database);
    await checkRowCounts(database);
    await checkValues(database);
    return metadata;
  } catch (error) {
    // SQLite errors (e.g. "file is not a database") mean the same thing to the user.
    if (error instanceof PackRejectedError) throw error;
    return reject();
  }
}
