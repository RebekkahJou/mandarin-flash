/**
 * Writes the curated Mandarin data (scripts/data/mandarin-starter-words.tsv and
 * mandarin-components.tsv) into the built-in Mandarin pack without rebuilding its dictionary, and
 * sets its pack and schema versions to the current ones. Run on a developer machine after
 * editing either file:
 *
 *   npm run update:mandarin-curated-data
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

import { PACK_SCHEMA_VERSION } from '../src/data/packSchema';
import { PackMetadataKey } from '../src/domain/packMetadata';
import { parseComponentsFile, writeComponents } from './lib/componentsFile';
import {
  MANDARIN_COMPONENTS_PATH,
  MANDARIN_PACK_PATH,
  MANDARIN_PACK_VERSION,
  MANDARIN_STARTER_WORDS_PATH,
} from './lib/mandarinPack';
import {
  findStarterWordProblems,
  parseStarterWordsFile,
  writeStarterWords,
} from './lib/starterWordsFile';

function setMetadata(database: Database.Database, key: PackMetadataKey, value: number): void {
  database.prepare('UPDATE pack_metadata SET value = ? WHERE key = ?').run(String(value), key);
}

function main(): void {
  const words = parseStarterWordsFile(readFileSync(MANDARIN_STARTER_WORDS_PATH, 'utf8'));
  const components = parseComponentsFile(readFileSync(MANDARIN_COMPONENTS_PATH, 'utf8'));
  const database = new Database(MANDARIN_PACK_PATH);
  const problems = findStarterWordProblems(database, words);
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  writeStarterWords(database, words);
  writeComponents(database, components);
  setMetadata(database, PackMetadataKey.PackVersion, MANDARIN_PACK_VERSION);
  setMetadata(database, PackMetadataKey.SchemaVersion, PACK_SCHEMA_VERSION);
  database.exec('VACUUM');
  database.close();
  console.log(
    `Wrote ${words.length} starter words and ${components.length} components ` +
      `(pack version ${MANDARIN_PACK_VERSION}, schema ${PACK_SCHEMA_VERSION}).`,
  );
}

main();
