import type {
  PackComponentRow,
  PackEntryRow,
  PackSentenceRow,
  PackWordSetEntryRow,
} from '../data/packSchema';
import type { SqlDatabase } from '../data/sqlDatabase';
import type { LanguageId } from '../domain/language';
import type { PartOfSpeech } from '../domain/partOfSpeech';
import { PartOfSpeech as PartsOfSpeech, hasPartOfSpeech } from '../domain/partOfSpeech';
import type { StarterWordType } from '../domain/starterVocabulary';
import { isStarterWordType } from '../domain/starterVocabulary';
import type { PackReading } from '../domain/savedReadingUpdates';
import type { WordSetTopic } from '../domain/wordSets';
import { isWordSetEntryForLanguage } from '../domain/wordSets';
import type { DefinitionCandidate, Word } from '../domain/word';

export interface DictionaryEntry {
  headword: string;
  /** Present only when it differs from the headword. */
  variant?: string;
  reading: string;
  definitionCandidates: DefinitionCandidate[];
}

export interface ExampleSentence {
  text: string;
  english: string;
}

/** How one language reads a pack that may serve several (e.g. Traditional and Simplified). */
export interface DictionaryForm {
  /**
   * Reads the pack through its variants: the variant becomes the headword and the variant
   * reading the reading (Simplified with mainland pinyin, from the Mandarin pack).
   */
  readsVariants: boolean;
  /** Sentences are stored like headwords; this converts them for display. */
  convertSentence: (text: string) => string;
}

/** A curated starter word with its dictionary entry, read the way the profile's language needs. */
export interface StarterWord {
  position: number;
  wordType: StarterWordType;
  entry: DictionaryEntry;
}

/** A character component (radical) for the Components list, in the profile's script. */
export interface CharacterComponent {
  component: string;
  /** Present only when it differs from the component. */
  variant?: string;
  /** Its usual name, e.g. 三點水. */
  name: string;
  /** The name's reading, e.g. "san1 dian3 shui3". */
  reading: string;
  meaning: string;
}

/** A topic word set the profile's language has entries in. */
export interface WordSetSummary {
  setId: string;
  title: string;
  /** Entries for the profile's language. */
  entryCount: number;
}

/** A word set entry with its curated meanings, read the way the profile's language needs. */
export interface WordSetEntry {
  setId: string;
  wordType: StarterWordType;
  headword: string;
  /** Present only when it differs from the headword. */
  variant?: string;
  reading: string;
  meanings: string[];
}

const MAX_EXAMPLE_SENTENCES = 3;
const ENTRY_COLUMNS = 'headword, variant, reading, variant_reading, glosses, rank';
const JOINED_ENTRY_COLUMNS =
  'entries.headword, entries.variant, entries.reading, entries.variant_reading, entries.glosses';

type StarterWordRow = PackEntryRow & { position: number; part_of_speech: string };

function partsOfSpeechFromFlags(flags: number): PartOfSpeech[] {
  return Object.values(PartsOfSpeech).filter((partOfSpeech) =>
    hasPartOfSpeech(flags, partOfSpeech),
  );
}

function isSerializedGloss(value: unknown): value is [string, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'string' &&
    Number.isInteger(value[1])
  );
}

/** Packs are validated on install, but a malformed gloss list still only loses its meanings. */
function definitionCandidatesFrom(serializedGlosses: string): DefinitionCandidate[] {
  let glosses: unknown;
  try {
    glosses = JSON.parse(serializedGlosses);
  } catch {
    return [];
  }
  if (!Array.isArray(glosses)) return [];
  return glosses
    .filter(isSerializedGloss)
    .map(([text, flags]) => ({ text, partsOfSpeech: partsOfSpeechFromFlags(flags) }));
}

/** The variant columns are empty when they match the headword's. */
function toDictionaryEntry(row: PackEntryRow, form: DictionaryForm): DictionaryEntry {
  const hasVariant = row.variant !== '';
  if (!form.readsVariants) {
    return {
      headword: row.headword,
      variant: hasVariant ? row.variant : undefined,
      reading: row.reading,
      definitionCandidates: definitionCandidatesFrom(row.glosses),
    };
  }
  return {
    headword: hasVariant ? row.variant : row.headword,
    variant: hasVariant ? row.headword : undefined,
    reading: row.variant_reading !== '' ? row.variant_reading : row.reading,
    definitionCandidates: definitionCandidatesFrom(row.glosses),
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Packs are validated on install, but malformed meanings still only lose that entry's meanings. */
function meaningsFrom(serializedMeanings: string): string[] {
  try {
    const meanings: unknown = JSON.parse(serializedMeanings);
    return isStringArray(meanings) ? meanings : [];
  } catch {
    return [];
  }
}

function toWordSetEntry(row: PackWordSetEntryRow, form: DictionaryForm): WordSetEntry | null {
  const meanings = meaningsFrom(row.meanings);
  if (!isStarterWordType(row.part_of_speech) || meanings.length === 0) return null;
  const { headword, variant, reading } = toDictionaryEntry({ ...row, glosses: '[]' }, form);
  return { setId: row.set_id, wordType: row.part_of_speech, headword, variant, reading, meanings };
}

async function hasTable(database: SqlDatabase, table: string): Promise<boolean> {
  const row = await database.getFirst(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
    [table],
  );
  return row !== null;
}

/**
 * One entry per reading, meanings in rank order. Taiwan readings can give two of a headword's
 * entries the same reading (地方 "place" and "local" are both dì fāng in Taiwan).
 */
export function mergeSameReadings(entries: readonly DictionaryEntry[]): DictionaryEntry[] {
  const byReading = new Map<string, DictionaryEntry>();
  for (const entry of entries) {
    const existing = byReading.get(entry.reading);
    if (!existing) {
      byReading.set(entry.reading, {
        ...entry,
        definitionCandidates: [...entry.definitionCandidates],
      });
      continue;
    }
    const knownTexts = new Set(existing.definitionCandidates.map((candidate) => candidate.text));
    const newCandidates = entry.definitionCandidates.filter(
      (candidate) => !knownTexts.has(candidate.text),
    );
    existing.definitionCandidates.push(...newCandidates);
  }
  return [...byReading.values()];
}

/** The entry with this normalized reading (numbered pinyin for Mandarin), if the dictionary has it. */
export function findReading(
  entries: readonly DictionaryEntry[],
  reading: string | undefined,
): DictionaryEntry | undefined {
  return entries.find((entry) => entry.reading.toLowerCase() === reading);
}

/** Every part of speech any reading of the word can take; empty if the word is unknown. */
export function partsOfSpeechOf(entries: readonly DictionaryEntry[]): PartOfSpeech[] {
  const found = new Set(
    entries.flatMap((entry) =>
      entry.definitionCandidates.flatMap((candidate) => candidate.partsOfSpeech),
    ),
  );
  return [...found] as PartOfSpeech[];
}

/**
 * Reads a language pack the way one language needs it. Headwords passed in must already be
 * normalized by that language (e.g. converted to Taiwan Traditional).
 */
export function createDictionaryLookup(
  packDatabase: SqlDatabase,
  form: DictionaryForm,
  reliablePartsOfSpeech: readonly PartOfSpeech[],
) {
  async function findRows(headword: string): Promise<PackEntryRow[]> {
    if (!form.readsVariants) {
      return packDatabase.getAll<PackEntryRow>(
        `SELECT ${ENTRY_COLUMNS} FROM entries WHERE headword = ? ORDER BY rank`,
        [headword],
      );
    }
    // Two branches so each can use its own index; "variant <> ''" lets SQLite use the partial one.
    return packDatabase.getAll<PackEntryRow>(
      `SELECT ${ENTRY_COLUMNS} FROM entries WHERE variant = ? AND variant <> ''
       UNION ALL
       SELECT ${ENTRY_COLUMNS} FROM entries WHERE headword = ? AND variant = ''
       ORDER BY rank`,
      [headword, headword],
    );
  }

  /** All readings of the word, most common first. */
  async function lookUp(headword: string): Promise<DictionaryEntry[]> {
    const rows = await findRows(headword);
    return mergeSameReadings(rows.map((row) => toDictionaryEntry(row, form)));
  }

  /** Shortest example sentences containing the word, shown in the language's script. */
  async function findExampleSentences(
    word: Pick<Word, 'headword' | 'variant'>,
  ): Promise<ExampleSentence[]> {
    // Sentences are stored the way the pack writes headwords.
    const storedForm = form.readsVariants ? (word.variant ?? word.headword) : word.headword;
    const rows = await packDatabase.getAll<PackSentenceRow>(
      `SELECT text, english FROM sentences
       WHERE instr(text, ?) > 0 ORDER BY length(text) LIMIT ?`,
      [storedForm, MAX_EXAMPLE_SENTENCES],
    );
    return rows.map((row) => ({ text: form.convertSentence(row.text), english: row.english }));
  }

  /** How many words each starter set has, by set number, in set order. */
  async function starterSetSizes(): Promise<Map<number, number>> {
    const rows = await packDatabase.getAll<{ set_number: number; word_count: number }>(
      `SELECT set_number, COUNT(*) AS word_count FROM starter_words
       GROUP BY set_number ORDER BY set_number`,
    );
    return new Map(rows.map((row) => [row.set_number, row.word_count]));
  }

  /**
   * A starter set in teaching order. Words are matched to their dictionary entries by headword
   * and reading (several entries with that reading are merged); a word the dictionary lacks, or
   * of a type this app doesn't know, is skipped.
   */
  async function starterWords(setNumber: number): Promise<StarterWord[]> {
    const rows = await packDatabase.getAll<StarterWordRow>(
      `SELECT starter_words.position, starter_words.part_of_speech, ${JOINED_ENTRY_COLUMNS}
       FROM starter_words JOIN entries
         ON entries.headword = starter_words.headword AND entries.reading = starter_words.reading
       WHERE starter_words.set_number = ?
       ORDER BY starter_words.position, entries.rank`,
      [setNumber],
    );
    const wordsByPosition = new Map<number, StarterWord>();
    for (const row of rows) {
      if (!isStarterWordType(row.part_of_speech)) continue;
      const entry = toDictionaryEntry(row, form);
      const existing = wordsByPosition.get(row.position);
      const merged = existing ? mergeSameReadings([existing.entry, entry])[0] : entry;
      wordsByPosition.set(row.position, {
        position: row.position,
        wordType: row.part_of_speech,
        entry: merged ?? entry,
      });
    }
    return [...wordsByPosition.values()];
  }

  /** The pack's components in teaching order; none for packs older than schema 2. */
  async function components(): Promise<CharacterComponent[]> {
    if (!(await hasTable(packDatabase, 'components'))) return [];
    const rows = await packDatabase.getAll<PackComponentRow>(
      'SELECT component, variant, name, reading, meaning FROM components ORDER BY position',
    );
    return rows.map((row) => {
      const hasVariant = row.variant !== '';
      const readsVariant = form.readsVariants && hasVariant;
      const otherForm = readsVariant ? row.component : row.variant;
      return {
        component: readsVariant ? row.variant : row.component,
        variant: hasVariant ? otherForm : undefined,
        name: form.convertSentence(row.name),
        reading: row.reading,
        meaning: row.meaning,
      };
    });
  }

  /** Entries of the chosen sets for this language, set by set in pack order. */
  async function readWordSetEntries(
    setIds: readonly string[],
    languageId: LanguageId,
  ): Promise<WordSetEntry[]> {
    if (setIds.length === 0 || !(await hasTable(packDatabase, 'word_sets'))) return [];
    const placeholders = setIds.map(() => '?').join(', ');
    const rows = await packDatabase.getAll<PackWordSetEntryRow>(
      `SELECT word_set_entries.set_id, word_set_entries.headword, word_set_entries.variant,
         word_set_entries.reading, word_set_entries.variant_reading,
         word_set_entries.part_of_speech, word_set_entries.meanings, word_set_entries.languages
       FROM word_set_entries
       JOIN word_sets ON word_sets.set_id = word_set_entries.set_id
       WHERE word_set_entries.set_id IN (${placeholders})
       ORDER BY word_sets.position, word_set_entries.position`,
      [...setIds],
    );
    return rows
      .filter((row) => isWordSetEntryForLanguage(row.languages, languageId))
      .flatMap((row) => toWordSetEntry(row, form) ?? []);
  }

  /** The topic's sets with entries for this language, in pack order; none before schema 3. */
  async function wordSets(topic: WordSetTopic, languageId: LanguageId): Promise<WordSetSummary[]> {
    if (!(await hasTable(packDatabase, 'word_sets'))) return [];
    const sets = await packDatabase.getAll<{ set_id: string; title: string }>(
      'SELECT set_id, title FROM word_sets WHERE topic = ? ORDER BY position',
      [topic],
    );
    const entries = await readWordSetEntries(
      sets.map((set) => set.set_id),
      languageId,
    );
    return sets
      .map((set) => ({
        setId: set.set_id,
        title: set.title,
        entryCount: entries.filter((entry) => entry.setId === set.set_id).length,
      }))
      .filter((set) => set.entryCount > 0);
  }

  /**
   * Every reading of each headword that has a replaced reading (variant_reading), for updating
   * words saved before the pack changed. Empty for languages that read the variants, since their
   * readings didn't change.
   */
  async function replacedReadings(): Promise<Map<string, PackReading[]>> {
    if (form.readsVariants) return new Map();
    const rows = await packDatabase.getAll<{
      headword: string;
      reading: string;
      variant_reading: string;
    }>(
      `SELECT headword, reading, variant_reading FROM entries
       WHERE headword IN (SELECT headword FROM entries WHERE variant_reading <> '')`,
    );
    const byHeadword = new Map<string, PackReading[]>();
    for (const row of rows) {
      const readings = byHeadword.get(row.headword) ?? [];
      readings.push({ reading: row.reading, replacedReading: row.variant_reading });
      byHeadword.set(row.headword, readings);
    }
    return byHeadword;
  }

  return {
    lookUp,
    replacedReadings,
    wordSets,
    wordSetEntries: readWordSetEntries,
    findExampleSentences,
    components,
    starterSetSizes,
    starterWords,
    /** Word types the pack tags well enough to warn when a word doesn't fit a list. */
    reliablePartsOfSpeech,
  };
}

export type DictionaryLookup = ReturnType<typeof createDictionaryLookup>;
