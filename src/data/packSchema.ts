/**
 * Layout of a language pack: a read-only SQLite database holding one language's dictionary,
 * example sentences, starter words and files such as fonts. Written by scripts/build-mandarin-pack.ts
 * (and later packs' scripts), checked by packValidation.ts and read by dictionaryLookup.ts.
 * Contains only public reference data, never user data.
 *
 * Bump PACK_SCHEMA_VERSION whenever the layout changes, and keep reading every version the app
 * still accepts (MIN_SUPPORTED_PACK_SCHEMA_VERSION), since installed packs aren't rebuilt.
 */
export const PACK_SCHEMA_VERSION = 1;
export const MIN_SUPPORTED_PACK_SCHEMA_VERSION = 1;

/** Written to pack_metadata.format so a stray SQLite file is never mistaken for a pack. */
export const PACK_FORMAT_NAME = 'mandarin-flash-pack';

export const PACK_SCHEMA_SQL = `
  CREATE TABLE pack_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE entries (
    id INTEGER PRIMARY KEY,
    headword TEXT NOT NULL,
    -- The word's other written form (Simplified for Mandarin). Empty when identical.
    variant TEXT NOT NULL,
    reading TEXT NOT NULL,
    -- The reading under the variant's conventions (mainland pinyin for Mandarin), used by
    -- languages that read the pack through its variants. Empty when identical to reading.
    variant_reading TEXT NOT NULL,
    -- JSON array of [gloss, partOfSpeechFlags] pairs, most important first.
    glosses TEXT NOT NULL,
    -- Lower rank = more common reading; orders several readings of one headword.
    rank INTEGER NOT NULL
  );
  CREATE INDEX entries_by_headword ON entries(headword, rank);
  -- Languages that read through variants search by them. Entries written the same both ways are
  -- found through the headword index, so this partial index stays small.
  CREATE INDEX entries_by_variant ON entries(variant, rank) WHERE variant <> '';

  CREATE TABLE sentences (
    id INTEGER PRIMARY KEY,
    -- Written like headwords; the language converts it when it reads through variants.
    text TEXT NOT NULL,
    english TEXT NOT NULL
  );

  -- Curated starter vocabulary: 10 sets of 50 words, in teaching order.
  CREATE TABLE starter_words (
    set_number INTEGER NOT NULL,
    position INTEGER NOT NULL,
    headword TEXT NOT NULL,
    reading TEXT NOT NULL,
    part_of_speech TEXT NOT NULL,
    PRIMARY KEY (set_number, position)
  ) WITHOUT ROWID;

  -- Fonts and other files, written to app storage when the pack is installed.
  CREATE TABLE pack_files (
    name TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    data BLOB NOT NULL
  ) WITHOUT ROWID;
`;

/** Every table and column a pack must have; used to reject malformed packs. */
export const PACK_TABLE_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  pack_metadata: ['key', 'value'],
  entries: ['id', 'headword', 'variant', 'reading', 'variant_reading', 'glosses', 'rank'],
  sentences: ['id', 'text', 'english'],
  starter_words: ['set_number', 'position', 'headword', 'reading', 'part_of_speech'],
  pack_files: ['name', 'kind', 'data'],
};

export const PACK_INDEX_NAMES: readonly string[] = ['entries_by_headword', 'entries_by_variant'];

export enum PackFileKind {
  Font = 'font',
}

export interface PackEntryRow {
  headword: string;
  variant: string;
  reading: string;
  variant_reading: string;
  glosses: string;
}

export interface PackSentenceRow {
  text: string;
  english: string;
}

export type SerializedGloss = [text: string, partOfSpeechFlags: number];
