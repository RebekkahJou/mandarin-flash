import { FrequencyTier } from './frequencyTier';
import type { Word } from './word';
import { WordListKind } from './wordList';

/** What All words shows, saved per profile. */
export interface AllWordsViewOptions {
  showsScriptStudyCards: boolean;
  showsComponents: boolean;
  showsRetentionWords: boolean;
}

/** The parts of a list All words needs to describe and filter a word's lists. */
export interface ListForAllWords {
  id: number;
  name: string;
  kind: WordListKind;
  isHidden: boolean;
}

const NO_LIST_LABEL = 'Not in any list';

function kindsOf(listIds: readonly number[], lists: readonly ListForAllWords[]): Set<WordListKind> {
  const ids = new Set(listIds);
  return new Set(lists.filter((list) => ids.has(list.id)).map((list) => list.kind));
}

/** True when any word is in a list of this kind, so its filter is worth offering. */
export function hasWordsInListKind(
  wordListIds: readonly (readonly number[])[],
  lists: readonly ListForAllWords[],
  kind: WordListKind,
): boolean {
  const listIdsOfKind = new Set(lists.filter((list) => list.kind === kind).map((list) => list.id));
  return wordListIds.some((listIds) => listIds.some((listId) => listIdsOfKind.has(listId)));
}

export function isShownInAllWords(
  word: Pick<Word, 'frequencyTier'>,
  listIds: readonly number[],
  lists: readonly ListForAllWords[],
  options: AllWordsViewOptions,
): boolean {
  if (!options.showsRetentionWords && word.frequencyTier === FrequencyTier.Retention) return false;
  const kinds = kindsOf(listIds, lists);
  if (!options.showsScriptStudyCards && kinds.has(WordListKind.ScriptStudy)) return false;
  return options.showsComponents || !kinds.has(WordListKind.Components);
}

export interface AllWordsCounts {
  shownCount: number;
  /** Words the view options hide (not words a search leaves out). */
  hiddenCount: number;
}

/** How many words All words shows with these options, and how many they hide. */
export function countAllWords(
  words: readonly { word: Pick<Word, 'frequencyTier'>; listIds: readonly number[] }[],
  lists: readonly ListForAllWords[],
  options: AllWordsViewOptions,
): AllWordsCounts {
  const shownCount = words.filter(({ word, listIds }) =>
    isShownInAllWords(word, listIds, lists, options),
  ).length;
  return { shownCount, hiddenCount: words.length - shownCount };
}

/**
 * The lists a word is in, as shown under it in All words. Hidden lists are named only when the
 * word is in no shown list, so a hidden Zhuyin card doesn't read "Not in any list".
 */
export function describeWordLists(
  listIds: readonly number[],
  lists: readonly ListForAllWords[],
): string {
  const ids = new Set(listIds);
  const wordLists = lists.filter((list) => ids.has(list.id));
  const shownNames = wordLists.filter((list) => !list.isHidden).map((list) => list.name);
  if (shownNames.length > 0) return shownNames.join(', ');
  const hiddenNames = wordLists.map((list) => list.name);
  if (hiddenNames.length === 0) return NO_LIST_LABEL;
  const label = hiddenNames.length === 1 ? 'In hidden list' : 'In hidden lists';
  return `${label}: ${hiddenNames.join(', ')}`;
}
