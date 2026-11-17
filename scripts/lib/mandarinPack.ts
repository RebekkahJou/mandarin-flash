import type Database from 'better-sqlite3';
import path from 'node:path';

import { PACK_FORMAT_NAME, PACK_SCHEMA_VERSION } from '../../src/data/packSchema';
import { LanguageId } from '../../src/domain/language';
import type { PackMetadata } from '../../src/domain/packMetadata';
import { packMetadataRows } from '../../src/domain/packMetadata';
import { PartOfSpeech } from '../../src/domain/partOfSpeech';

/**
 * Bump when the Mandarin data changes. The app copies the built-in pack again when this changes
 * (bump BUILT_IN_PACK_COPY_VERSION in src/data/openDatabases.ts too), and an imported Mandarin pack only
 * replaces the built-in one when its version is higher.
 */
export const MANDARIN_PACK_VERSION = 4;

export const MANDARIN_PACK_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'data',
  'mandarin-pack.db',
);

/** Curated starter vocabulary, written into the pack by both pack scripts. */
export const MANDARIN_STARTER_WORDS_PATH = path.join(
  __dirname,
  '..',
  'data',
  'mandarin-starter-words.tsv',
);

/** Curated character components for the Components list. */
export const MANDARIN_COMPONENTS_PATH = path.join(
  __dirname,
  '..',
  'data',
  'mandarin-components.tsv',
);

/** Curated topic word sets (health vocabulary) and their entries. */
export const MANDARIN_WORD_SETS_PATH = path.join(__dirname, '..', 'data', 'mandarin-word-sets.tsv');
export const MANDARIN_WORD_SET_ENTRIES_PATH = path.join(
  __dirname,
  '..',
  'data',
  'mandarin-word-set-entries.tsv',
);

/** Taiwan readings from Wiktionary, applied over CC-CEDICT's mainland ones. */
export const MANDARIN_TAIWAN_READINGS_PATH = path.join(
  __dirname,
  '..',
  'data',
  'mandarin-taiwan-readings.tsv',
);

/** One pack serves Traditional and Simplified; Simplified reads it through the variants. */
export const MANDARIN_PACK_METADATA: PackMetadata = {
  packId: 'mandarin',
  packVersion: MANDARIN_PACK_VERSION,
  schemaVersion: PACK_SCHEMA_VERSION,
  title: 'Mandarin',
  languageIds: [LanguageId.MandarinTraditional, LanguageId.MandarinSimplified],
  // CC-CEDICT glosses are tagged by an English heuristic that is only dependable for these.
  reliablePartsOfSpeech: [PartOfSpeech.Noun, PartOfSpeech.Verb, PartOfSpeech.Adjective],
  licenses: [
    {
      name: 'CC-CEDICT',
      usage: 'Dictionary meanings and pinyin',
      license: 'Creative Commons Attribution-ShareAlike 4.0',
      source: 'mdbg.net/chinese/dictionary?page=cc-cedict',
    },
    {
      name: 'Wiktionary',
      usage: 'Taiwan pronunciations',
      license: 'Creative Commons Attribution-ShareAlike 4.0',
      source: 'en.wiktionary.org (extracted by kaikki.org)',
    },
    {
      name: 'Tatoeba',
      usage: 'Example sentences',
      license: 'Creative Commons Attribution 2.0 France',
      source: 'tatoeba.org',
    },
  ],
};

export function writePackMetadata(database: Database.Database, metadata: PackMetadata): void {
  const insert = database.prepare('INSERT INTO pack_metadata (key, value) VALUES (?, ?)');
  for (const [key, value] of packMetadataRows(metadata, PACK_FORMAT_NAME)) insert.run(key, value);
}
