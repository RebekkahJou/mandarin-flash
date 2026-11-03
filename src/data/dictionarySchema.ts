/**
 * Layout of the bundled, read-only dictionary.db. Written by scripts/build-dictionary.ts,
 * read by src/services/dictionaryLookup.ts. Contains only public reference data, never user data.
 */
export const DICTIONARY_SCHEMA_SQL = `
  CREATE TABLE entries (
    id INTEGER PRIMARY KEY,
    traditional TEXT NOT NULL,
    -- Empty when identical to traditional. Input is converted to Traditional before lookup,
    -- so this column is only displayed, never searched (no index needed).
    simplified TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    -- JSON array of [gloss, partOfSpeechFlags] pairs, most important first.
    glosses TEXT NOT NULL,
    -- Lower rank = more common reading; used to order several readings of one character.
    rank INTEGER NOT NULL
  );
  CREATE INDEX entries_by_traditional ON entries(traditional, rank);

  CREATE TABLE sentences (
    id INTEGER PRIMARY KEY,
    traditional TEXT NOT NULL,
    english TEXT NOT NULL
  );
`;

export interface DictionaryEntryRow {
  traditional: string;
  simplified: string;
  pinyin: string;
  glosses: string;
}

export interface SentenceRow {
  traditional: string;
  english: string;
}

export type SerializedGloss = [text: string, partOfSpeechFlags: number];
