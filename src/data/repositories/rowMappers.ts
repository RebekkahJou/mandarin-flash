import { FrequencyTier, isFrequencyTier } from '../../domain/frequencyTier';
import { GeneralWordList } from '../../domain/generalWordList';
import { isPartOfSpeech } from '../../domain/partOfSpeech';
import { PartOfSpeechWordList } from '../../domain/partOfSpeechWordList';
import type { Word } from '../../domain/word';
import type { WordList, WordListEntry } from '../../domain/wordList';
import { WordListKind } from '../../domain/wordList';

export interface WordRow {
  id: number;
  profile_id: number;
  headword: string;
  variant: string | null;
  reading: string;
  definitions: string;
  frequency_tier: string;
}

export interface WordListRow {
  id: number;
  profile_id: number;
  name: string;
  kind: string;
  part_of_speech: string | null;
}

export type WordListEntryRow = WordRow & {
  entry_id: number;
  definitions_override: string | null;
};

export const WORD_COLUMNS =
  'words.id, words.profile_id, words.headword, words.variant, words.reading, words.definitions, words.frequency_tier';

export function serializeDefinitions(definitions: readonly string[]): string {
  return JSON.stringify(definitions);
}

export function parseDefinitions(serialized: string): string[] {
  const parsed: unknown = JSON.parse(serialized);
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
}

export function toWord(row: WordRow): Word {
  return {
    id: row.id,
    profileId: row.profile_id,
    headword: row.headword,
    variant: row.variant ?? undefined,
    reading: row.reading,
    definitions: parseDefinitions(row.definitions),
    // An unexpected stored value falls back to the most frequent tier rather than hiding the word.
    frequencyTier: isFrequencyTier(row.frequency_tier)
      ? row.frequency_tier
      : FrequencyTier.HighIncidence,
  };
}

export function toWordListEntry(row: WordListEntryRow): WordListEntry {
  return {
    entryId: row.entry_id,
    word: toWord(row),
    definitionsOverride:
      row.definitions_override === null ? undefined : parseDefinitions(row.definitions_override),
  };
}

export function toWordList(row: WordListRow, entries: WordListEntry[] = []): WordList {
  const props = { id: row.id, profileId: row.profile_id, name: row.name, entries };
  if (
    row.kind === WordListKind.PartOfSpeech &&
    row.part_of_speech &&
    isPartOfSpeech(row.part_of_speech)
  ) {
    return new PartOfSpeechWordList({ ...props, partOfSpeech: row.part_of_speech });
  }
  return new GeneralWordList(props);
}
