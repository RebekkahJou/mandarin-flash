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
  /** Character components (radicals), filled from the language pack. */
  Components = 'components',
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

  /** Duplicates are allowed; callers warn the user first using containsHeadword. */
  addWord(entry: WordListEntry): void {
    this.entries = [...this.entries, entry];
  }

  removeWord(entryId: number): void {
    this.entries = this.entries.filter((entry) => entry.entryId !== entryId);
  }

  containsHeadword(headword: string): boolean {
    return this.entries.some((entry) => entry.word.headword === headword);
  }

  selectDefaultMeanings(candidates: readonly DefinitionCandidate[]): string[] {
    return firstMeanings(candidates);
  }

  /**
   * Returns a warning when the word doesn't fit this list, or null when it does. Only word types
   * the language's dictionary tags reliably are judged.
   */
  validateWord(
    _wordPartsOfSpeech: readonly PartOfSpeech[],
    _reliablePartsOfSpeech: readonly PartOfSpeech[],
  ): WordListValidationWarning | null {
    return null;
  }
}

export function definitionsForEntry(entry: WordListEntry): string[] {
  return entry.definitionsOverride ?? entry.word.definitions;
}

export function firstMeanings(candidates: readonly DefinitionCandidate[]): string[] {
  return candidates.slice(0, DEFAULT_MEANING_COUNT).map((candidate) => candidate.text);
}

/**
 * Every meaning a word shows in any list: its own meanings first, then meanings that only some
 * lists use (e.g. the verb meaning picked for Verbs), each once.
 */
export function allMeaningsOf(
  ownMeanings: readonly string[],
  listMeanings: readonly (readonly string[])[],
): string[] {
  return [...new Set([...ownMeanings, ...listMeanings.flat()])];
}

export function haveSameMeanings(first: readonly string[], second: readonly string[]): boolean {
  return (
    first.length === second.length && first.every((meaning, index) => meaning === second[index])
  );
}

/**
 * What to store as a list's own meanings for a word. Null when they match the word's meanings,
 * so later changes to the word still show in this list.
 */
export function definitionsOverrideFor(
  word: Word,
  listMeanings: readonly string[],
): string[] | null {
  if (listMeanings.length === 0 || haveSameMeanings(listMeanings, word.definitions)) return null;
  return [...listMeanings];
}
