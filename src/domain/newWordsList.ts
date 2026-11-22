/**
 * The New Words list: the profile's most recently added High practice words that were never
 * marked Learned, as a small focus set. It is worked out from the words each time, never stored.
 */
import type { WordList } from './wordList';
import { WordListKind } from './wordList';

export const NEW_WORDS_LIST_NAME = 'New Words';

export const NEW_WORDS_LIST_SIZES = [10, 20, 30, 40] as const;
export type NewWordsListSize = (typeof NEW_WORDS_LIST_SIZES)[number];
export const DEFAULT_NEW_WORDS_LIST_SIZE: NewWordsListSize = 10;

/** A word that may join New Words: High practice and never marked Learned. */
export interface NewWordCandidate {
  id: number;
  addedAtMs: number;
}

/**
 * Spreads word ids evenly (a 32-bit integer hash), so words added at the same time are picked in
 * an order that looks random but stays the same each time the list opens.
 */
function tieBreakKey(wordId: number): number {
  let hash = Math.imul(wordId ^ (wordId >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** The newest candidates first, up to the list size; fewer when fewer qualify. */
export function selectNewWords<Candidate extends NewWordCandidate>(
  candidates: readonly Candidate[],
  listSize: number,
): Candidate[] {
  return [...candidates]
    .sort(
      (first, second) =>
        second.addedAtMs - first.addedAtMs || tieBreakKey(first.id) - tieBreakKey(second.id),
    )
    .slice(0, listSize);
}

export function isNewWordsList(list: Pick<WordList, 'kind'>): boolean {
  return list.kind === WordListKind.NewWords;
}

/** Lists a word can be put into by hand; New Words fills itself. */
export function listsForAddingWords<List extends Pick<WordList, 'kind'>>(
  lists: readonly List[],
): List[] {
  return lists.filter((list) => !isNewWordsList(list));
}
