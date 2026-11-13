/**
 * Builds the built-in Mandarin pack (assets/data/mandarin-pack.db) from public data sources.
 * Run on a developer machine only:
 *
 *   npm run build:mandarin-pack -- <sourceDirectory>
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

import { PACK_SCHEMA_SQL } from '../src/data/packSchema';
import type { SerializedGloss } from '../src/data/packSchema';
import { toTaiwanTraditional } from '../src/services/chineseConverter';
import type { CedictEntry } from './lib/cedictParser';
import { isCrossReferenceOnly, parseCedictLine, usefulGlosses } from './lib/cedictParser';
import { parseComponentsFile, writeComponents } from './lib/componentsFile';
import {
  MANDARIN_COMPONENTS_PATH,
  MANDARIN_PACK_METADATA,
  MANDARIN_PACK_PATH,
  MANDARIN_STARTER_WORDS_PATH,
  writePackMetadata,
} from './lib/mandarinPack';
import { tagGloss } from './lib/partOfSpeechTagger';
import {
  findStarterWordProblems,
  parseStarterWordsFile,
  writeStarterWords,
} from './lib/starterWordsFile';

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
    `INSERT INTO entries (headword, variant, reading, variant_reading, glosses, rank)
     VALUES (?, ?, ?, ?, ?, ?)`,
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
      entry.mainlandPinyin === entry.pinyin ? '' : entry.mainlandPinyin,
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
  const insert = database.prepare('INSERT INTO sentences (text, english) VALUES (?, ?)');
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
      'Usage: npm run build:mandarin-pack -- <directory containing cedict.txt and Tatoeba TSVs>',
    );
    process.exit(1);
  }
  rmSync(MANDARIN_PACK_PATH, { force: true });
  const database = new Database(MANDARIN_PACK_PATH);
  database.exec(PACK_SCHEMA_SQL);
  writePackMetadata(database, MANDARIN_PACK_METADATA);
  const build = database.transaction(() => ({
    entryCount: insertEntries(database, path.join(sourceDirectory, 'cedict.txt')),
    sentenceCount: insertSentences(database, sourceDirectory),
  }));
  const { entryCount, sentenceCount } = build();
  const starterWords = parseStarterWordsFile(readFileSync(MANDARIN_STARTER_WORDS_PATH, 'utf8'));
  // A dictionary update can drop a reading; report it so the word list gets fixed.
  for (const problem of findStarterWordProblems(database, starterWords)) console.error(problem);
  writeStarterWords(database, starterWords);
  writeComponents(database, parseComponentsFile(readFileSync(MANDARIN_COMPONENTS_PATH, 'utf8')));
  database.exec('VACUUM');
  database.close();
  const sizeInMegabytes = (statSync(MANDARIN_PACK_PATH).size / BYTES_PER_MEGABYTE).toFixed(1);
  console.log(
    `Wrote ${entryCount} entries and ${sentenceCount} sentences (${sizeInMegabytes} MB).`,
  );
}

main();
