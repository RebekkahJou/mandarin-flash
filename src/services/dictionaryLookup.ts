import type { DictionaryEntryRow, SentenceRow, SerializedGloss } from '../data/dictionarySchema';
import type { SqlDatabase } from '../data/sqlDatabase';
import type { PartOfSpeech } from '../domain/partOfSpeech';
import { PartOfSpeech as PartsOfSpeech, hasPartOfSpeech } from '../domain/partOfSpeech';
import type { DefinitionCandidate } from '../domain/word';
import { toTaiwanTraditional } from './chineseConverter';

export interface DictionaryEntry {
  traditional: string;
  simplified?: string;
  pinyin: string;
  definitionCandidates: DefinitionCandidate[];
}

export interface ExampleSentence {
  traditional: string;
  english: string;
}

const MAX_EXAMPLE_SENTENCES = 3;

function partsOfSpeechFromFlags(flags: number): PartOfSpeech[] {
  return Object.values(PartsOfSpeech).filter((partOfSpeech) =>
    hasPartOfSpeech(flags, partOfSpeech),
  );
}

function toDictionaryEntry(row: DictionaryEntryRow): DictionaryEntry {
  const glosses = JSON.parse(row.glosses) as SerializedGloss[];
  return {
    traditional: row.traditional,
    simplified: row.simplified || undefined,
    pinyin: row.pinyin,
    definitionCandidates: glosses.map(([text, flags]) => ({
      text,
      partsOfSpeech: partsOfSpeechFromFlags(flags),
    })),
  };
}

/** The reading with this numbered pinyin, if the dictionary has it. */
export function findReading(
  entries: readonly DictionaryEntry[],
  numberedPinyin: string | undefined,
): DictionaryEntry | undefined {
  return entries.find((entry) => entry.pinyin.toLowerCase() === numberedPinyin);
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

/** Reads the bundled, read-only dictionary. Input may be Simplified; it is converted first. */
export function createDictionaryLookup(dictionaryDatabase: SqlDatabase) {
  /** All readings of the word, most common first. */
  async function lookUp(characters: string): Promise<DictionaryEntry[]> {
    const traditional = toTaiwanTraditional(characters);
    const rows = await dictionaryDatabase.getAll<DictionaryEntryRow>(
      'SELECT traditional, simplified, pinyin, glosses FROM entries WHERE traditional = ? ORDER BY rank',
      [traditional],
    );
    return rows.map(toDictionaryEntry);
  }

  /** Shortest example sentences containing the word. */
  async function findExampleSentences(traditional: string): Promise<ExampleSentence[]> {
    return dictionaryDatabase.getAll<SentenceRow>(
      `SELECT traditional, english FROM sentences
       WHERE instr(traditional, ?) > 0 ORDER BY length(traditional) LIMIT ?`,
      [traditional, MAX_EXAMPLE_SENTENCES],
    );
  }

  return { lookUp, findExampleSentences };
}

export type DictionaryLookup = ReturnType<typeof createDictionaryLookup>;
