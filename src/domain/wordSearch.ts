import type { Word } from './word';

/** Folds a reading or query so loosely typed queries still match; supplied by the language. */
export type ReadingSearchKey = (text: string) => string;

/**
 * True when the query appears in the headword, its variant, the reading or a meaning. Callers may
 * pass more meanings than the word's own, e.g. ones only some lists use.
 */
export function matchesWordSearch(
  word: Word,
  query: string,
  readingSearchKey: ReadingSearchKey,
  meanings: readonly string[] = word.definitions,
): boolean {
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery.length === 0) return true;
  const readingQuery = readingSearchKey(trimmedQuery);
  return (
    word.headword.includes(trimmedQuery) ||
    (word.variant?.includes(trimmedQuery) ?? false) ||
    (readingQuery.length > 0 && readingSearchKey(word.reading).includes(readingQuery)) ||
    meanings.some((meaning) => meaning.toLowerCase().includes(trimmedQuery))
  );
}
