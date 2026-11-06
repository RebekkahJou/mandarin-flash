import type { Word } from './word';

/** Folds a reading or query so loosely typed queries still match; supplied by the language. */
export type ReadingSearchKey = (text: string) => string;

/** True when the query appears in the headword, its variant, the reading or a meaning. */
export function matchesWordSearch(
  word: Word,
  query: string,
  readingSearchKey: ReadingSearchKey,
): boolean {
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery.length === 0) return true;
  const readingQuery = readingSearchKey(trimmedQuery);
  return (
    word.headword.includes(trimmedQuery) ||
    (word.variant?.includes(trimmedQuery) ?? false) ||
    (readingQuery.length > 0 && readingSearchKey(word.reading).includes(readingQuery)) ||
    word.definitions.some((meaning) => meaning.toLowerCase().includes(trimmedQuery))
  );
}
