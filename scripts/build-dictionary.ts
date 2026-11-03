/**
 * Builds assets/data/dictionary.db from public data sources. Run on a developer machine only:
 *
 *   npm run build:dictionary -- <sourceDirectory>
 *
 * <sourceDirectory> must contain (see docs/THIRD_PARTY.md for download links and licenses):
 *   cedict.txt          CC-CEDICT, unzipped
 *   cmn_sentences.tsv   Tatoeba Mandarin sentences
 *   eng_sentences.tsv   Tatoeba English sentences
 *   cmn-eng_links.tsv   Tatoeba Mandarin→English translation links
 */
import Database from 'better-sqlite3';
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

import { DICTIONARY_SCHEMA_SQL } from '../src/data/dictionarySchema';
import type { SerializedGloss } from '../src/data/dictionarySchema';
import { toTaiwanTraditional } from '../src/services/chineseConverter';
import type { CedictEntry } from './lib/cedictParser';
import { isCrossReferenceOnly, parseCedictLine, usefulGlosses } from './lib/cedictParser';
import { tagGloss } from './lib/partOfSpeechTagger';

const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'data', 'dictionary.db');
/** Short sentences are easiest for learners and keep the bundle small. */
const MAX_SENTENCE_CHARACTERS = 15;
const MAX_SENTENCES = 25_000;
const BYTES_PER_MEGABYTE = 1024 * 1024;

function readLines(filePath: string): string[] {
  return readFileSync(filePath, 'utf8').split(/\r?\n/);
}

/** Lower is more common: ordinary words before proper nouns, then readings with more meanings. */
function entryRank(entry: CedictEntry, glossCount: number): number {
  const isProperNoun = /^[A-Z]/.test(entry.pinyin);
  const properNounPenalty = isProperNoun ? 1000 : 0;
  return properNounPenalty - glossCount;
}

function insertEntries(database: Database.Database, cedictPath: string): number {
  const insert = database.prepare(
    'INSERT INTO entries (traditional, simplified, pinyin, glosses, rank) VALUES (?, ?, ?, ?, ?)',
  );
  let insertedCount = 0;
  for (const line of readLines(cedictPath)) {
    const entry = parseCedictLine(line);
    if (!entry || isCrossReferenceOnly(entry)) continue;
    const glosses: SerializedGloss[] = usefulGlosses(entry).map((gloss) => [
      gloss,
      tagGloss(gloss, entry.hasClassifier),
    ]);
    if (glosses.length === 0) continue;
    insert.run(
      entry.traditional,
      entry.simplified === entry.traditional ? '' : entry.simplified,
      entry.pinyin,
      JSON.stringify(glosses),
      entryRank(entry, glosses.length),
    );
    insertedCount++;
  }
  return insertedCount;
}

function readSentences(filePath: string): Map<string, string> {
  const sentencesById = new Map<string, string>();
  for (const line of readLines(filePath)) {
    const [sentenceId, , text] = line.split('\t');
    if (sentenceId && text) sentencesById.set(sentenceId, text);
  }
  return sentencesById;
}

function insertSentences(database: Database.Database, sourceDirectory: string): number {
  const mandarinById = readSentences(path.join(sourceDirectory, 'cmn_sentences.tsv'));
  const englishById = readSentences(path.join(sourceDirectory, 'eng_sentences.tsv'));
  const insert = database.prepare('INSERT INTO sentences (traditional, english) VALUES (?, ?)');
  const seenSentences = new Set<string>();
  const candidates: { traditional: string; english: string }[] = [];
  for (const line of readLines(path.join(sourceDirectory, 'cmn-eng_links.tsv'))) {
    const [mandarinId, englishId] = line.split('\t');
    const mandarin = mandarinById.get(mandarinId);
    const english = englishById.get(englishId);
    if (!mandarin || !english || mandarin.length > MAX_SENTENCE_CHARACTERS) continue;
    const traditional = toTaiwanTraditional(mandarin);
    if (seenSentences.has(traditional)) continue;
    seenSentences.add(traditional);
    candidates.push({ traditional, english });
  }
  candidates.sort((first, second) => first.traditional.length - second.traditional.length);
  const kept = candidates.slice(0, MAX_SENTENCES);
  for (const sentence of kept) insert.run(sentence.traditional, sentence.english);
  return kept.length;
}

function main(): void {
  const sourceDirectory = process.argv[2];
  if (!sourceDirectory || !existsSync(path.join(sourceDirectory, 'cedict.txt'))) {
    console.error(
      'Usage: npm run build:dictionary -- <directory containing cedict.txt and Tatoeba TSVs>',
    );
    process.exit(1);
  }
  rmSync(OUTPUT_PATH, { force: true });
  const database = new Database(OUTPUT_PATH);
  database.exec(DICTIONARY_SCHEMA_SQL);
  const build = database.transaction(() => ({
    entryCount: insertEntries(database, path.join(sourceDirectory, 'cedict.txt')),
    sentenceCount: insertSentences(database, sourceDirectory),
  }));
  const { entryCount, sentenceCount } = build();
  database.exec('VACUUM');
  database.close();
  const sizeInMegabytes = (statSync(OUTPUT_PATH).size / BYTES_PER_MEGABYTE).toFixed(1);
  console.log(
    `Wrote ${entryCount} entries and ${sentenceCount} sentences (${sizeInMegabytes} MB).`,
  );
}

main();
