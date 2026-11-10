import type Database from 'better-sqlite3';

import type { StarterWordType } from '../../src/domain/starterVocabulary';
import { isStarterWordType } from '../../src/domain/starterVocabulary';

/** One curated starter word, as listed in scripts/data/<language>-starter-words.tsv. */
export interface StarterWordLine {
  setNumber: number;
  position: number;
  headword: string;
  reading: string;
  wordType: StarterWordType;
}

const HEADER = ['set', 'headword', 'reading', 'word_type'];

/**
 * Parses a tab-separated starter words file: a header row, then set, headword, reading and word
 * type. Positions follow the file's order within each set. Throws on the first bad line.
 */
export function parseStarterWordsFile(text: string): StarterWordLine[] {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (headerLine?.split('\t').join() !== HEADER.join()) {
    throw new Error(`The first line must be: ${HEADER.join(' <tab> ')}`);
  }
  const nextPositionBySet = new Map<number, number>();
  return lines.map((line, index) => {
    const [setText, headword, reading, wordType] = line.split('\t');
    const setNumber = Number(setText);
    const lineNumber = index + 2;
    if (!Number.isSafeInteger(setNumber) || setNumber < 1 || !headword || !reading) {
      throw new Error(`Line ${lineNumber} needs a set number, headword and reading.`);
    }
    if (!wordType || !isStarterWordType(wordType)) {
      throw new Error(`Line ${lineNumber} has an unknown word type "${wordType}".`);
    }
    const position = (nextPositionBySet.get(setNumber) ?? 0) + 1;
    nextPositionBySet.set(setNumber, position);
    return { setNumber, position, headword, reading, wordType };
  });
}

/** Lines whose headword and reading match no dictionary entry, or repeat an earlier line. */
export function findStarterWordProblems(
  database: Database.Database,
  words: readonly StarterWordLine[],
): string[] {
  const findEntry = database.prepare('SELECT 1 FROM entries WHERE headword = ? AND reading = ?');
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const word of words) {
    const key = `${word.headword} ${word.reading}`;
    if (seen.has(key)) problems.push(`${key} is listed twice.`);
    seen.add(key);
    const isInDictionary = findEntry.get(word.headword, word.reading) !== undefined;
    if (!isInDictionary) problems.push(`${key} is not in the dictionary.`);
  }
  return problems;
}

/** Replaces the pack's starter words. */
export function writeStarterWords(
  database: Database.Database,
  words: readonly StarterWordLine[],
): void {
  const insert = database.prepare(
    `INSERT INTO starter_words (set_number, position, headword, reading, part_of_speech)
     VALUES (?, ?, ?, ?, ?)`,
  );
  database.transaction(() => {
    database.exec('DELETE FROM starter_words');
    for (const word of words) {
      insert.run(word.setNumber, word.position, word.headword, word.reading, word.wordType);
    }
  })();
}
