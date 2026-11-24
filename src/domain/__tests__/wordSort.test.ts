import { FrequencyTier } from '../frequencyTier';
import {
  WordSort,
  availableSubSorts,
  availableWordSorts,
  compareSortKeys,
  englishSortKey,
  learningLevelSortKey,
  radicalSortKey,
  resolveWordSort,
  sortByKey,
} from '../wordSort';

describe('compareSortKeys', () => {
  it('compares part by part, numbers by value and shorter keys first', () => {
    expect(compareSortKeys([1, 'b'], [1, 'a'])).toBeGreaterThan(0);
    expect(compareSortKeys([2], [10])).toBeLessThan(0);
    expect(compareSortKeys(['ma'], ['ma', 1])).toBeLessThan(0);
    expect(compareSortKeys(['ma', 1], ['ma', 1])).toBe(0);
  });
});

describe('sortByKey', () => {
  it('keeps the earlier position first when keys are equal', () => {
    const items = ['b2', 'a1', 'b1', 'a2'];
    expect(sortByKey(items, (item) => [item[0]])).toEqual(['a1', 'a2', 'b2', 'b1']);
  });
});

describe('sort keys', () => {
  it('sorts English by the first meaning, ignoring a leading "to" and brackets', () => {
    const meanings = [['to walk'], ['(polite) you'], ['apple']];
    const sorted = sortByKey(meanings, englishSortKey);
    expect(sorted).toEqual([['apple'], ['to walk'], ['(polite) you']]);
  });

  it('puts High practice first', () => {
    const tiers = [FrequencyTier.Retention, FrequencyTier.HighIncidence];
    expect(sortByKey(tiers, learningLevelSortKey)).toEqual([
      FrequencyTier.HighIncidence,
      FrequencyTier.Retention,
    ]);
  });

  it('orders characters by radical, then remaining strokes, unknown ones last', () => {
    const positions: Record<string, { radical: number; remainingStrokes: number }> = {
      人: { radical: 9, remainingStrokes: 0 },
      你: { radical: 9, remainingStrokes: 5 },
      口: { radical: 30, remainingStrokes: 0 },
    };
    const keyFor = (headword: string) =>
      radicalSortKey(headword, (character) => positions[character]);
    expect(sortByKey(['口', '〇', '你', '人'], keyFor)).toEqual(['人', '你', '口', '〇']);
  });
});

describe('available sorts', () => {
  const context = {
    languageSorts: [WordSort.Pinyin, WordSort.Radical, WordSort.Zhuyin],
    isZhuyinInUse: false,
  };

  it('offers zhuyin only while it is in use, and learning level last', () => {
    expect(availableWordSorts(context)).toEqual([
      WordSort.Newest,
      WordSort.Pinyin,
      WordSort.Radical,
      WordSort.English,
      WordSort.LearningLevel,
    ]);
    expect(availableSubSorts({ ...context, isZhuyinInUse: true })).toContain(WordSort.Zhuyin);
  });

  it('falls back to newest first for a saved sort that no longer applies', () => {
    const available = availableWordSorts(context);
    expect(resolveWordSort(WordSort.Zhuyin, available)).toBe(WordSort.Newest);
    expect(resolveWordSort(WordSort.Pinyin, available)).toBe(WordSort.Pinyin);
  });
});
