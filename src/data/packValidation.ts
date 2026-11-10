import type { PackMetadata } from '../domain/packMetadata';
import { PackRejectedError, parsePackMetadata } from '../domain/packMetadata';
import {
  COMPONENTS_TABLE_SCHEMA_VERSION,
  MIN_SUPPORTED_PACK_SCHEMA_VERSION,
  PACK_FILE_NAME_PATTERN,
  PACK_FORMAT_NAME,
  PACK_INDEX_NAMES,
  PACK_SCHEMA_VERSION,
  packTableColumnsFor,
} from './packSchema';
import type { SqlDatabase } from './sqlDatabase';

/** Limits generous enough for any real pack, small enough that a bad one can't swamp the phone. */
export const PACK_LIMITS = {
  maxEntries: 600_000,
  maxSentences: 200_000,
  maxStarterWords: 1_000,
  maxComponents: 1_000,
  maxComponentFieldLength: 200,
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
async function checkSchemaObjects(database: SqlDatabase, schemaVersion: number): Promise<void> {
  const objects = await database.getAll<{ type: string; name: string }>(
    'SELECT type, name FROM sqlite_master',
  );
  const expectedTables = new Set(Object.keys(packTableColumnsFor(schemaVersion)));
  const expectedIndexes = new Set(PACK_INDEX_NAMES);
  for (const { type, name } of objects) {
    if (name.startsWith(SQLITE_INTERNAL_PREFIX)) continue;
    const isExpected =
      (type === 'table' && expectedTables.has(name)) ||
      (type === 'index' && expectedIndexes.has(name));
    if (!isExpected) reject();
  }
}

async function checkColumns(database: SqlDatabase, schemaVersion: number): Promise<void> {
  for (const [table, expectedColumns] of Object.entries(packTableColumnsFor(schemaVersion))) {
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
  // Table names come from packSchema.ts, never from the pack, so interpolating is safe.
  const row = await database.getFirst<{ row_count: number }>(
    `SELECT COUNT(*) AS row_count FROM ${table}`,
  );
  return row?.row_count ?? 0;
}

async function checkRowCounts(database: SqlDatabase, schemaVersion: number): Promise<void> {
  const limits: [table: string, maxRows: number][] = [
    ['entries', PACK_LIMITS.maxEntries],
    ['sentences', PACK_LIMITS.maxSentences],
    ['starter_words', PACK_LIMITS.maxStarterWords],
    ['pack_files', PACK_LIMITS.maxFiles],
  ];
  if (schemaVersion >= COMPONENTS_TABLE_SCHEMA_VERSION) {
    limits.push(['components', PACK_LIMITS.maxComponents]);
  }
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
const BAD_COMPONENT_QUERY = `SELECT 1 FROM components WHERE typeof(position) <> 'integer'
  OR typeof(component) <> 'text' OR typeof(variant) <> 'text' OR typeof(name) <> 'text'
  OR typeof(reading) <> 'text' OR typeof(meaning) <> 'text'
  OR length(component) NOT BETWEEN 1 AND ? OR length(variant) > ? OR length(name) > ?
  OR length(reading) > ? OR length(meaning) > ? LIMIT 1`;

async function checkValues(database: SqlDatabase, schemaVersion: number): Promise<void> {
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
  if (schemaVersion >= COMPONENTS_TABLE_SCHEMA_VERSION) {
    const fieldLength = PACK_LIMITS.maxComponentFieldLength;
    badRowQueries.push([
      BAD_COMPONENT_QUERY,
      [
        PACK_LIMITS.maxHeadwordLength,
        PACK_LIMITS.maxHeadwordLength,
        fieldLength,
        fieldLength,
        fieldLength,
      ],
    ]);
  }
  for (const [sql, params] of badRowQueries) {
    if (await hasAnyRow(database, sql, params)) reject();
  }
}

async function checkFileNames(database: SqlDatabase): Promise<void> {
  const rows = await database.getAll<{ name: string }>('SELECT name FROM pack_files');
  if (!rows.every((row) => PACK_FILE_NAME_PATTERN.test(row.name))) reject();
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
    // The metadata says which schema version's tables to expect.
    const metadata = await readPackMetadata(database);
    await checkSchemaObjects(database, metadata.schemaVersion);
    await checkColumns(database, metadata.schemaVersion);
    await checkRowCounts(database, metadata.schemaVersion);
    await checkValues(database, metadata.schemaVersion);
    await checkFileNames(database);
    return metadata;
  } catch (error) {
    // SQLite errors (e.g. "file is not a database") mean the same thing to the user.
    if (error instanceof PackRejectedError) throw error;
    return reject();
  }
}
