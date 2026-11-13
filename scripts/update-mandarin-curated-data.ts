/**
 * Writes the curated Mandarin data (scripts/data/mandarin-taiwan-readings.tsv,
 * mandarin-starter-words.tsv, mandarin-components.tsv and the mandarin-word-set*.tsv files) into
 * the built-in Mandarin pack without rebuilding its dictionary, and rewrites its metadata
 * (versions and licenses) from MANDARIN_PACK_METADATA. Run on a developer machine after
 * editing either file:
 *
 *   npm run update:mandarin-curated-data
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

import { PACK_SCHEMA_VERSION } from '../src/data/packSchema';
import { parseComponentsFile, writeComponents } from './lib/componentsFile';
import {
  MANDARIN_COMPONENTS_PATH,
  MANDARIN_PACK_METADATA,
  MANDARIN_PACK_PATH,
  MANDARIN_PACK_VERSION,
  MANDARIN_STARTER_WORDS_PATH,
  MANDARIN_WORD_SETS_PATH,
  MANDARIN_TAIWAN_READINGS_PATH,
  MANDARIN_WORD_SET_ENTRIES_PATH,
  writePackMetadata,
} from './lib/mandarinPack';
import {
  findStarterWordProblems,
  parseStarterWordsFile,
  writeStarterWords,
} from './lib/starterWordsFile';
import { applyTaiwanReadings, parseTaiwanReadingsFile } from './lib/taiwanReadingsFile';
import {
  findWordSetReadingNotes,
  parseWordSetEntriesFile,
  parseWordSetsFile,
  writeWordSets,
} from './lib/wordSetsFile';

function main(): void {
  const words = parseStarterWordsFile(readFileSync(MANDARIN_STARTER_WORDS_PATH, 'utf8'));
  const components = parseComponentsFile(readFileSync(MANDARIN_COMPONENTS_PATH, 'utf8'));
  const wordSets = parseWordSetsFile(readFileSync(MANDARIN_WORD_SETS_PATH, 'utf8'));
  const wordSetEntries = parseWordSetEntriesFile(
    readFileSync(MANDARIN_WORD_SET_ENTRIES_PATH, 'utf8'),
    wordSets,
  );
  const taiwanReadings = parseTaiwanReadingsFile(
    readFileSync(MANDARIN_TAIWAN_READINGS_PATH, 'utf8'),
  );
  const database = new Database(MANDARIN_PACK_PATH);
  const updatedCount = applyTaiwanReadings(database, taiwanReadings);
  console.log(`Gave ${updatedCount} entries their Taiwan reading.`);
  const problems = findStarterWordProblems(database, words);
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  writeStarterWords(database, words);
  writeComponents(database, components);
  for (const note of findWordSetReadingNotes(database, wordSetEntries)) console.warn(note);
  writeWordSets(database, wordSets, wordSetEntries);
  database.exec('DELETE FROM pack_metadata');
  writePackMetadata(database, MANDARIN_PACK_METADATA);
  database.exec('VACUUM');
  database.close();
  console.log(
    `Wrote ${words.length} starter words, ${components.length} components and ` +
      `${wordSetEntries.length} entries in ${wordSets.length} word sets ` +
      `(pack version ${MANDARIN_PACK_VERSION}, schema ${PACK_SCHEMA_VERSION}).`,
  );
}

main();
