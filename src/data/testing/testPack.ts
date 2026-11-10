import { LanguageId } from '../../domain/language';
import type { PackMetadata } from '../../domain/packMetadata';
import { packMetadataRows } from '../../domain/packMetadata';
import { PartOfSpeech } from '../../domain/partOfSpeech';
import { PACK_FORMAT_NAME, PACK_SCHEMA_SQL, PACK_SCHEMA_VERSION } from '../packSchema';
import type { SqlDatabase } from '../sqlDatabase';

/** Metadata of a small valid Mandarin pack, for tests. Not bundled into the app. */
export const TEST_PACK_METADATA: PackMetadata = {
  packId: 'mandarin',
  packVersion: 1,
  schemaVersion: PACK_SCHEMA_VERSION,
  title: 'Mandarin',
  languageIds: [LanguageId.MandarinTraditional, LanguageId.MandarinSimplified],
  reliablePartsOfSpeech: [PartOfSpeech.Noun, PartOfSpeech.Verb, PartOfSpeech.Adjective],
  licenses: [
    {
      name: 'CC-CEDICT',
      usage: 'Dictionary meanings and pinyin',
      license: 'Creative Commons Attribution-ShareAlike 4.0',
      source: 'mdbg.net/chinese/dictionary?page=cc-cedict',
    },
  ],
};

/** Creates the pack tables and metadata in an empty database. */
export async function writeTestPack(
  database: SqlDatabase,
  metadata: PackMetadata = TEST_PACK_METADATA,
): Promise<void> {
  await database.exec(PACK_SCHEMA_SQL);
  for (const [key, value] of packMetadataRows(metadata, PACK_FORMAT_NAME)) {
    await database.run('INSERT INTO pack_metadata (key, value) VALUES (?, ?)', [key, value]);
  }
}

export const INSERT_PACK_ENTRY_SQL = `INSERT INTO entries
  (headword, variant, reading, variant_reading, glosses, rank) VALUES (?, ?, ?, ?, ?, ?)`;
