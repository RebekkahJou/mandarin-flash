import type { DefinitionCandidate, Word } from './word';
import { DEFAULT_MEANING_COUNT } from './word';
import type { PartOfSpeech } from './partOfSpeech';

export interface WordListEntry {
  entryId: number;
  word: Word;
  /** Set only when the user changed this word's meaning inside this specific list. */
  definitionsOverride?: string[];
}

export enum WordListKind {
  General = 'general',
  PartOfSpeech = 'part_of_speech',
}

export interface WordListValidationWarning {
  listName: string;
  message: string;
}

export interface WordListProps {
  id: number;
  profileId: number;
  name: string;
  entries?: WordListEntry[];
}

/** Base type for every word list. Subclasses change meaning selection and validation. */
export abstract class WordList {
  abstract readonly kind: WordListKind;
  readonly id: number;
  readonly profileId: number;
  readonly name: string;
  private entries: WordListEntry[];

  constructor({ id, profileId, name, entries = [] }: WordListProps) {
    this.id = id;
    this.profileId = profileId;
    this.name = name;
    this.entries = [...entries];
  }

  get length(): number {
    return this.entries.length;
  }

  get words(): readonly WordListEntry[] {
    return this.entries;
  }

  /** Duplicates are allowed; callers warn the user first using containsCharacter. */
  addWord(entry: WordListEntry): void {
    this.entries = [...this.entries, entry];
  }

  removeWord(entryId: number): void {
    this.entries = this.entries.filter((entry) => entry.entryId !== entryId);
  }

  containsCharacter(traditional: string): boolean {
    return this.entries.some((entry) => entry.word.traditional === traditional);
  }

  selectDefaultMeanings(candidates: readonly DefinitionCandidate[]): string[] {
    return firstMeanings(candidates);
  }

  /** Returns a warning when the word doesn't fit this list, or null when it does. */
  validateWord(_wordPartsOfSpeech: readonly PartOfSpeech[]): WordListValidationWarning | null {
    return null;
  }
}

export function definitionsForEntry(entry: WordListEntry): string[] {
  return entry.definitionsOverride ?? entry.word.definitions;
}

export function firstMeanings(candidates: readonly DefinitionCandidate[]): string[] {
  return candidates.slice(0, DEFAULT_MEANING_COUNT).map((candidate) => candidate.text);
}
