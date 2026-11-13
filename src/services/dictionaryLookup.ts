import type { PackComponentRow, PackEntryRow, PackSentenceRow } from '../data/packSchema';
import type { SqlDatabase } from '../data/sqlDatabase';
import type { PartOfSpeech } from '../domain/partOfSpeech';
import { PartOfSpeech as PartsOfSpeech, hasPartOfSpeech } from '../domain/partOfSpeech';
import type { StarterWordType } from '../domain/starterVocabulary';
import { isStarterWordType } from '../domain/starterVocabulary';
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
    return rows.map((row) => toDictionaryEntry(row, form));
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
   * A starter set in teaching order. Words are matched to their dictionary entry by headword and
   * reading; a word the dictionary lacks, or of a type this app doesn't know, is skipped.
   */
  async function starterWords(setNumber: number): Promise<StarterWord[]> {
    const rows = await packDatabase.getAll<StarterWordRow>(
      `SELECT starter_words.position, starter_words.part_of_speech, ${JOINED_ENTRY_COLUMNS}
       FROM starter_words JOIN entries
         ON entries.headword = starter_words.headword AND entries.reading = starter_words.reading
       WHERE starter_words.set_number = ?
       GROUP BY starter_words.position
       ORDER BY starter_words.position`,
      [setNumber],
    );
    return rows.flatMap((row) =>
      isStarterWordType(row.part_of_speech)
        ? [
            {
              position: row.position,
              wordType: row.part_of_speech,
              entry: toDictionaryEntry(row, form),
            },
          ]
        : [],
    );
  }

  /** The pack's components in teaching order; none for packs older than schema 2. */
  async function components(): Promise<CharacterComponent[]> {
    const table = await packDatabase.getFirst(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'components'",
    );
    if (!table) return [];
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

  return {
    lookUp,
    findExampleSentences,
    components,
    starterSetSizes,
    starterWords,
    /** Word types the pack tags well enough to warn when a word doesn't fit a list. */
    reliablePartsOfSpeech,
  };
}

export type DictionaryLookup = ReturnType<typeof createDictionaryLookup>;
