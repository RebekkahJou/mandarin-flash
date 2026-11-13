import type Database from 'better-sqlite3';

import { WORD_SETS_TABLES_SQL } from '../../src/data/packSchema';
import { isLanguageId } from '../../src/domain/language';
import type { StarterWordType } from '../../src/domain/starterVocabulary';
import { isStarterWordType } from '../../src/domain/starterVocabulary';
import { WORD_SET_LANGUAGE_SEPARATOR, WordSetTopic } from '../../src/domain/wordSets';
import { toMainlandSimplified } from '../../src/services/chineseConverter';

/** One set, as listed in scripts/data/<language>-word-sets.tsv; positions follow file order. */
export interface WordSetLine {
  setId: string;
  topic: WordSetTopic;
  title: string;
}

/** One entry, as listed in scripts/data/<language>-word-set-entries.tsv. */
export interface WordSetEntryLine {
  setId: string;
  position: number;
  headword: string;
  reading: string;
  wordType: StarterWordType;
  meanings: string[];
  /** Empty for every language of the pack. */
  languages: string[];
}

const SETS_HEADER = ['set_id', 'topic', 'title'];
const ENTRIES_HEADER = [
  'set_id',
  'headword',
  'reading',
  'word_type',
  'meanings',
  'languages',
  'note',
];
const SET_ID_PATTERN = /^[a-z0-9-]{1,60}$/;
/** Numbered pinyin syllables; a lone capital letter stands for itself (照X光). */
const NUMBERED_READING_PATTERN = /^([a-z:]+[1-5]|[A-Z])( ([a-z:]+[1-5]|[A-Z]))*$/;
const MEANING_SEPARATOR = '; ';

function dataLines(text: string, header: readonly string[]): string[] {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (headerLine?.split('\t').join() !== header.join()) {
    throw new Error(`The first line must be: ${header.join(' <tab> ')}`);
  }
  return lines;
}

function isWordSetTopic(value: string): value is WordSetTopic {
  return (Object.values(WordSetTopic) as string[]).includes(value);
}

/** Parses the sets file: a header row, then set id, topic and title. */
export function parseWordSetsFile(text: string): WordSetLine[] {
  const seen = new Set<string>();
  return dataLines(text, SETS_HEADER).map((line, index) => {
    const [setId = '', topic = '', title] = line.split('\t');
    const lineNumber = index + 2;
    if (!SET_ID_PATTERN.test(setId) || !title) {
      throw new Error(`Line ${lineNumber} needs a set id (a-z, 0-9, -) and a title.`);
    }
    if (!isWordSetTopic(topic)) throw new Error(`Line ${lineNumber} has an unknown topic.`);
    if (seen.has(setId)) throw new Error(`Line ${lineNumber} repeats the set ${setId}.`);
    seen.add(setId);
    return { setId, topic, title };
  });
}

function parseLanguages(text: string, lineNumber: number): string[] {
  if (text === '') return [];
  const languages = text.split(WORD_SET_LANGUAGE_SEPARATOR);
  if (!languages.every(isLanguageId)) {
    throw new Error(`Line ${lineNumber} has an unknown language in "${text}".`);
  }
  return languages;
}

function parseEntryLine(line: string, lineNumber: number, setIds: ReadonlySet<string>) {
  const [setId = '', headword, reading = '', wordType = '', meanings = '', languages = ''] =
    line.split('\t');
  if (!setIds.has(setId)) throw new Error(`Line ${lineNumber} names an unknown set "${setId}".`);
  if (!headword || !NUMBERED_READING_PATTERN.test(reading) || meanings.trim() === '') {
    throw new Error(`Line ${lineNumber} needs a headword, numbered reading and meanings.`);
  }
  if (!isStarterWordType(wordType)) {
    throw new Error(`Line ${lineNumber} has an unknown word type "${wordType}".`);
  }
  return {
    setId,
    headword,
    reading,
    wordType,
    meanings: meanings.split(MEANING_SEPARATOR).map((meaning) => meaning.trim()),
    languages: parseLanguages(languages, lineNumber),
  };
}

/**
 * Parses the entries file: a header row, then set id, headword (written like dictionary
 * headwords), numbered reading, word type, meanings separated by "; ", languages (empty for all,
 * else comma-separated ids) and a note for curators that isn't shipped. Positions follow the
 * file's order within each set.
 */
export function parseWordSetEntriesFile(
  text: string,
  sets: readonly WordSetLine[],
): WordSetEntryLine[] {
  const setIds = new Set(sets.map((set) => set.setId));
  const nextPositionBySet = new Map<string, number>();
  const seen = new Set<string>();
  return dataLines(text, ENTRIES_HEADER).map((line, index) => {
    const lineNumber = index + 2;
    const entry = parseEntryLine(line, lineNumber, setIds);
    const key = `${entry.setId} ${entry.headword} ${entry.reading}`;
    if (seen.has(key)) throw new Error(`Line ${lineNumber} repeats ${key}.`);
    seen.add(key);
    const position = (nextPositionBySet.get(entry.setId) ?? 0) + 1;
    nextPositionBySet.set(entry.setId, position);
    return { ...entry, position };
  });
}

/**
 * Entries whose headword is in the dictionary but not with this reading. Not an error (Taiwan
 * readings sometimes differ), but a word added with Add Word would then be stored twice.
 */
export function findWordSetReadingNotes(
  database: Database.Database,
  entries: readonly WordSetEntryLine[],
): string[] {
  const findReadings = database.prepare<[string], { reading: string }>(
    'SELECT reading FROM entries WHERE headword = ?',
  );
  return entries.flatMap((entry) => {
    const readings = findReadings.all(entry.headword).map((row) => row.reading);
    if (readings.length === 0 || readings.includes(entry.reading)) return [];
    return [`${entry.headword} ${entry.reading}: the dictionary has ${readings.join(' / ')}.`];
  });
}

interface StoredForms {
  variant: string;
  variantReading: string;
}

/**
 * The dictionary's Simplified form and mainland reading when it has the word; otherwise the
 * converted form with the same reading.
 */
function storedForms(database: Database.Database, entry: WordSetEntryLine): StoredForms {
  const row = database
    .prepare<[string, string], { variant: string; variant_reading: string }>(
      'SELECT variant, variant_reading FROM entries WHERE headword = ? AND reading = ? LIMIT 1',
    )
    .get(entry.headword, entry.reading);
  if (row) return { variant: row.variant, variantReading: row.variant_reading };
  const converted = toMainlandSimplified(entry.headword);
  return { variant: converted === entry.headword ? '' : converted, variantReading: '' };
}

/** Replaces the pack's word sets, creating the tables in a pack built before schema 3. */
export function writeWordSets(
  database: Database.Database,
  sets: readonly WordSetLine[],
  entries: readonly WordSetEntryLine[],
): void {
  const hasTables = database
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'word_sets'")
    .get();
  database.transaction(() => {
    if (!hasTables) database.exec(WORD_SETS_TABLES_SQL);
    database.exec('DELETE FROM word_sets; DELETE FROM word_set_entries');
    // Prepared only now, since the tables may have just been created.
    const insertSet = database.prepare(
      'INSERT INTO word_sets (set_id, topic, title, position) VALUES (?, ?, ?, ?)',
    );
    sets.forEach((set, index) => insertSet.run(set.setId, set.topic, set.title, index + 1));
    const insertEntry = database.prepare(
      `INSERT INTO word_set_entries (set_id, position, headword, variant, reading,
         variant_reading, part_of_speech, meanings, languages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const entry of entries) {
      const { variant, variantReading } = storedForms(database, entry);
      insertEntry.run(
        entry.setId,
        entry.position,
        entry.headword,
        variant,
        entry.reading,
        variantReading,
        entry.wordType,
        JSON.stringify(entry.meanings),
        entry.languages.join(WORD_SET_LANGUAGE_SEPARATOR),
      );
    }
  })();
}
