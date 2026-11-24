/**
 * Orders for All words. Each word gets a sort key (a list of numbers and text compared in turn);
 * words with equal keys keep their order before sorting, which is newest first.
 */
import type { FrequencyTier } from './frequencyTier';
import { FREQUENCY_TIERS_IN_ORDER } from './frequencyTier';
import { englishMeaningKeys } from './sharedWords';

/** Stored in settings, so never change an existing value. */
export enum WordSort {
  /** The order words were added, newest first. */
  Newest = 'newest',
  Pinyin = 'pinyin',
  /** By radical, then strokes after the radical, as Taiwan dictionaries order characters. */
  Radical = 'radical',
  Zhuyin = 'zhuyin',
  /** By the first listed meaning. */
  English = 'english',
  /** High practice first, then a second sort within each level. */
  LearningLevel = 'learning_level',
}

/** One part of a sort key: numbers compare by value, text by code point. */
export type SortKeyPart = number | string;
export type SortKey = readonly SortKeyPart[];

/** A character's place in radical order. */
export interface RadicalPosition {
  /** Kangxi radical number, 1 to 214. */
  radical: number;
  /** Strokes after the radical. */
  remainingStrokes: number;
}

/** Characters without radical data (punctuation, symbols) sort after all others. */
const UNKNOWN_RADICAL_POSITION: RadicalPosition = {
  radical: Number.MAX_SAFE_INTEGER,
  remainingStrokes: Number.MAX_SAFE_INTEGER,
};

function comparePart(first: SortKeyPart, second: SortKeyPart): number {
  if (typeof first === 'number' && typeof second === 'number') return first - second;
  const firstText = String(first);
  const secondText = String(second);
  if (firstText === secondText) return 0;
  return firstText < secondText ? -1 : 1;
}

/** Part by part; a key that is the start of a longer one comes first. */
export function compareSortKeys(first: SortKey, second: SortKey): number {
  const sharedLength = Math.min(first.length, second.length);
  for (let index = 0; index < sharedLength; index++) {
    const comparison = comparePart(first[index], second[index]);
    if (comparison !== 0) return comparison;
  }
  return first.length - second.length;
}

/** Sorts by key, keeping the earlier position first when keys are equal. */
export function sortByKey<Item>(items: readonly Item[], keyFor: (item: Item) => SortKey): Item[] {
  return items
    .map((item, position) => ({ item, position, key: keyFor(item) }))
    .sort(
      (first, second) => compareSortKeys(first.key, second.key) || first.position - second.position,
    )
    .map(({ item }) => item);
}

const BRACKET_CHARACTERS = /[()[\]（）]/g;

/**
 * By the first meaning without brackets or a leading "to"; a meaning that is all in brackets,
 * such as "(classifier for books)", sorts by the words inside them.
 */
export function englishSortKey(definitions: readonly string[]): SortKey {
  const [firstMeaning = ''] = definitions;
  const [key] = englishMeaningKeys([firstMeaning]);
  if (key) return [key];
  return [englishMeaningKeys([firstMeaning.replace(BRACKET_CHARACTERS, '')])[0] ?? ''];
}

export function learningLevelSortKey(tier: FrequencyTier): SortKey {
  return [FREQUENCY_TIERS_IN_ORDER.indexOf(tier)];
}

/** Character by character: radical, then remaining strokes, then code point. */
export function radicalSortKey(
  headword: string,
  radicalPositionOf: (character: string) => RadicalPosition | undefined,
): SortKey {
  return [...headword].flatMap((character) => {
    const { radical, remainingStrokes } = radicalPositionOf(character) ?? UNKNOWN_RADICAL_POSITION;
    return [radical, remainingStrokes, character.codePointAt(0) ?? 0];
  });
}

/** What decides which sorts a profile is offered. */
export interface WordSortContext {
  /** The language's own sorts, in menu order, e.g. Pinyin, Radical and Zhuyin. */
  languageSorts: readonly WordSort[];
  /** Zhuyin is shown on cards or studied, so sorting by it makes sense. */
  isZhuyinInUse: boolean;
}

/** The sorts offered within each learning level. */
export function availableSubSorts(context: WordSortContext): WordSort[] {
  const languageSorts = context.languageSorts.filter(
    (sort) => sort !== WordSort.Zhuyin || context.isZhuyinInUse,
  );
  return [WordSort.Newest, ...languageSorts, WordSort.English];
}

export function availableWordSorts(context: WordSortContext): WordSort[] {
  return [...availableSubSorts(context), WordSort.LearningLevel];
}

/** A saved sort that no longer applies (e.g. zhuyin turned off) falls back to newest first. */
export function resolveWordSort(saved: WordSort, available: readonly WordSort[]): WordSort {
  return available.includes(saved) ? saved : WordSort.Newest;
}
