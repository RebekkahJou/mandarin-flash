import {
  canRenameOrDeleteList,
  defaultListIdsForNewWords,
  defaultWordListsFor,
  listKindFor,
  suggestedWordListsFor,
} from '../defaultWordLists';
import { GeneralWordList } from '../generalWordList';
import { PartOfSpeech } from '../partOfSpeech';
import { WordListKind } from '../wordList';

const MEASURE_WORDS = { name: 'Measure words', partOfSpeech: PartOfSpeech.MeasureWord };

describe('defaultWordListsFor', () => {
  it("adds the language's own lists after the shared ones", () => {
    const names = defaultWordListsFor([MEASURE_WORDS]).map((list) => list.name);
    expect(names.slice(0, 2)).toEqual(['General Vocabulary', 'Focus Vocabulary']);
    expect(names).toContain('Adverbs');
    expect(names[names.length - 1]).toBe('Measure words');
  });
});

describe('suggestedWordListsFor', () => {
  it('offers missing default lists and suggestions, skipping names in use', () => {
    const names = suggestedWordListsFor(
      [MEASURE_WORDS],
      defaultWordListsFor([]).map((list) => list.name),
    ).map((list) => list.name);
    expect(names[0]).toBe('Measure words');
    expect(names).toContain('Pronouns');
    expect(names).not.toContain('Nouns');
  });

  it('compares names ignoring case', () => {
    const names = suggestedWordListsFor([], ['pronouns']).map((list) => list.name);
    expect(names).not.toContain('Pronouns');
  });
});

describe('defaultListIdsForNewWords', () => {
  it('selects General Vocabulary', () => {
    const lists = [
      new GeneralWordList({ id: 4, profileId: 1, name: 'Focus Vocabulary' }),
      new GeneralWordList({ id: 7, profileId: 1, name: 'General Vocabulary' }),
    ];
    expect(defaultListIdsForNewWords(lists)).toEqual(new Set([7]));
  });

  it('selects nothing when General Vocabulary is missing', () => {
    expect(defaultListIdsForNewWords([])).toEqual(new Set());
  });
});

describe('canRenameOrDeleteList', () => {
  it('protects only General Vocabulary', () => {
    const general = new GeneralWordList({ id: 1, profileId: 1, name: 'General Vocabulary' });
    const focus = new GeneralWordList({ id: 2, profileId: 1, name: 'Focus Vocabulary' });
    expect(canRenameOrDeleteList(general)).toBe(false);
    expect(canRenameOrDeleteList(focus)).toBe(true);
  });
});

describe('listKindFor', () => {
  it('uses a special kind when given, else derives it from the part of speech', () => {
    expect(listKindFor({ name: 'Components', kind: WordListKind.Components })).toBe(
      WordListKind.Components,
    );
    expect(listKindFor({ name: 'Nouns', partOfSpeech: PartOfSpeech.Noun })).toBe(
      WordListKind.PartOfSpeech,
    );
    expect(listKindFor({ name: 'Focus Vocabulary' })).toBe(WordListKind.General);
  });
});
