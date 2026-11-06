import type { DictionaryEntryRow, SentenceRow, SerializedGloss } from '../data/dictionarySchema';
import type { SqlDatabase } from '../data/sqlDatabase';
import type { PartOfSpeech } from '../domain/partOfSpeech';
import { PartOfSpeech as PartsOfSpeech, hasPartOfSpeech } from '../domain/partOfSpeech';
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

export enum ChineseScript {
  Traditional = 'traditional',
  Simplified = 'simplified',
}

/**
 * How one language reads the bundled Mandarin dictionary. Interim until Phase 3, when each
 * language gets a pack already laid out as headword, variant and reading.
 */
export interface DictionaryForm {
  /** The script headwords are written in; the other script becomes the variant. */
  script: ChineseScript;
  /** Mainland pronunciations instead of Taiwan ones, where CC-CEDICT gives both. */
  usesMainlandReadings: boolean;
  /** Example sentences are stored in Taiwan Traditional; this converts them for display. */
  convertSentence: (text: string) => string;
}

const MAX_EXAMPLE_SENTENCES = 3;
const ENTRY_COLUMNS = 'traditional, simplified, pinyin, mainland_pinyin, glosses, rank';

function partsOfSpeechFromFlags(flags: number): PartOfSpeech[] {
  return Object.values(PartsOfSpeech).filter((partOfSpeech) =>
    hasPartOfSpeech(flags, partOfSpeech),
  );
}

function definitionCandidatesFrom(serializedGlosses: string): DefinitionCandidate[] {
  const glosses = JSON.parse(serializedGlosses) as SerializedGloss[];
  return glosses.map(([text, flags]) => ({ text, partsOfSpeech: partsOfSpeechFromFlags(flags) }));
}

/** The simplified column is empty when both scripts write the word the same way. */
function toDictionaryEntry(row: DictionaryEntryRow, form: DictionaryForm): DictionaryEntry {
  const isSimplified = form.script === ChineseScript.Simplified;
  const hasSimplifiedForm = row.simplified !== '';
  const simplifiedForm = hasSimplifiedForm ? row.simplified : row.traditional;
  const otherScriptForm = isSimplified ? row.traditional : row.simplified;
  const usesMainlandReading = form.usesMainlandReadings && row.mainland_pinyin !== '';
  return {
    headword: isSimplified ? simplifiedForm : row.traditional,
    variant: hasSimplifiedForm ? otherScriptForm : undefined,
    reading: usesMainlandReading ? row.mainland_pinyin : row.pinyin,
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
 * Reads the bundled, read-only dictionary the way one language needs it. Headwords passed in
 * must already be normalized by that language (e.g. converted to Taiwan Traditional).
 */
export function createDictionaryLookup(dictionaryDatabase: SqlDatabase, form: DictionaryForm) {
  async function findRows(headword: string): Promise<DictionaryEntryRow[]> {
    if (form.script === ChineseScript.Traditional) {
      return dictionaryDatabase.getAll<DictionaryEntryRow>(
        `SELECT ${ENTRY_COLUMNS} FROM entries WHERE traditional = ? ORDER BY rank`,
        [headword],
      );
    }
    // Two branches so each can use its own index; "simplified <> ''" lets SQLite use the partial one.
    return dictionaryDatabase.getAll<DictionaryEntryRow>(
      `SELECT ${ENTRY_COLUMNS} FROM entries WHERE simplified = ? AND simplified <> ''
       UNION ALL
       SELECT ${ENTRY_COLUMNS} FROM entries WHERE traditional = ? AND simplified = ''
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
    const isSimplified = form.script === ChineseScript.Simplified;
    const traditionalForm = isSimplified ? (word.variant ?? word.headword) : word.headword;
    const rows = await dictionaryDatabase.getAll<SentenceRow>(
      `SELECT traditional, english FROM sentences
       WHERE instr(traditional, ?) > 0 ORDER BY length(traditional) LIMIT ?`,
      [traditionalForm, MAX_EXAMPLE_SENTENCES],
    );
    return rows.map((row) => ({
      text: form.convertSentence(row.traditional),
      english: row.english,
    }));
  }

  return { lookUp, findExampleSentences };
}

export type DictionaryLookup = ReturnType<typeof createDictionaryLookup>;
