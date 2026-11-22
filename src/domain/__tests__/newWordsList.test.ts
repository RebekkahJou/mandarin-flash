import { isNewWordsList, listsForAddingWords, selectNewWords } from '../newWordsList';
import { WordListKind } from '../wordList';

describe('selectNewWords', () => {
  it('takes the most recently added words, up to the list size', () => {
    const candidates = [
      { id: 1, addedAtMs: 100 },
      { id: 2, addedAtMs: 300 },
      { id: 3, addedAtMs: 200 },
    ];
    expect(selectNewWords(candidates, 2).map((word) => word.id)).toEqual([2, 3]);
  });

  it('returns fewer words when fewer qualify', () => {
    expect(selectNewWords([{ id: 1, addedAtMs: 100 }], 10)).toHaveLength(1);
  });

  it('picks among words added together in a scrambled but stable order', () => {
    const together = Array.from({ length: 40 }, (_, index) => ({ id: index + 1, addedAtMs: 500 }));
    const picked = selectNewWords(together, 10).map((word) => word.id);
    expect(picked).toHaveLength(10);
    expect(picked).not.toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(selectNewWords([...together].reverse(), 10).map((word) => word.id)).toEqual(picked);
  });

  it('lets newer words push older ones out', () => {
    const older = Array.from({ length: 10 }, (_, index) => ({ id: index + 1, addedAtMs: 100 }));
    const newer = { id: 99, addedAtMs: 200 };
    const picked = selectNewWords([...older, newer], 10).map((word) => word.id);
    expect(picked[0]).toBe(99);
    expect(picked).toHaveLength(10);
  });
});

describe('listsForAddingWords', () => {
  it('leaves out New Words, which fills itself', () => {
    const lists = [{ kind: WordListKind.General }, { kind: WordListKind.NewWords }];
    expect(listsForAddingWords(lists)).toEqual([{ kind: WordListKind.General }]);
    expect(isNewWordsList({ kind: WordListKind.NewWords })).toBe(true);
  });
});
