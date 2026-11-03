import type { Word } from './word';
import type { WordListEntry } from './wordList';
import { definitionsForEntry } from './wordList';

/** A word as it appears in practice, with the meanings of the list being practiced. */
export interface PracticeCard {
  word: Word;
  definitions: string[];
}

/** One card per word: duplicate entries in a list never put the same word in a set twice. */
export function distinctPracticeCards(entries: readonly WordListEntry[]): PracticeCard[] {
  const cardsByWordId = new Map<number, PracticeCard>();
  for (const entry of entries) {
    if (!cardsByWordId.has(entry.word.id)) {
      cardsByWordId.set(entry.word.id, {
        word: entry.word,
        definitions: definitionsForEntry(entry),
      });
    }
  }
  return [...cardsByWordId.values()];
}
