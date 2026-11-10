/**
 * Writes the curated starter words (scripts/data/mandarin-starter-words.tsv) into the built-in
 * Mandarin pack without rebuilding its dictionary, and sets the pack version to
 * MANDARIN_PACK_VERSION. Run on a developer machine after editing the word list:
 *
 *   npm run update:mandarin-starter-words
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

import { PackMetadataKey } from '../src/domain/packMetadata';
import {
  MANDARIN_PACK_PATH,
  MANDARIN_PACK_VERSION,
  MANDARIN_STARTER_WORDS_PATH,
} from './lib/mandarinPack';
import {
  findStarterWordProblems,
  parseStarterWordsFile,
  writeStarterWords,
} from './lib/starterWordsFile';

function main(): void {
  const words = parseStarterWordsFile(readFileSync(MANDARIN_STARTER_WORDS_PATH, 'utf8'));
  const database = new Database(MANDARIN_PACK_PATH);
  const problems = findStarterWordProblems(database, words);
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  writeStarterWords(database, words);
  database
    .prepare('UPDATE pack_metadata SET value = ? WHERE key = ?')
    .run(String(MANDARIN_PACK_VERSION), PackMetadataKey.PackVersion);
  database.exec('VACUUM');
  database.close();
  const setCount = new Set(words.map((word) => word.setNumber)).size;
  console.log(
    `Wrote ${words.length} starter words in ${setCount} sets (pack version ${MANDARIN_PACK_VERSION}).`,
  );
}

main();
