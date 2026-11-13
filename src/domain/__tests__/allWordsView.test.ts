import type { AllWordsViewOptions, ListForAllWords } from '../allWordsView';
import { describeWordLists, hasWordsInListKind, isShownInAllWords } from '../allWordsView';
import { FrequencyTier } from '../frequencyTier';
import { WordListKind } from '../wordList';

const LISTS: ListForAllWords[] = [
  { id: 1, name: 'General Vocabulary', kind: WordListKind.General, isHidden: false },
  { id: 2, name: 'Nouns', kind: WordListKind.PartOfSpeech, isHidden: false },
  { id: 3, name: 'Zhuyin', kind: WordListKind.ScriptStudy, isHidden: true },
  { id: 4, name: 'Components', kind: WordListKind.Components, isHidden: true },
];

const SHOW_ALL: AllWordsViewOptions = {
  showsScriptStudyCards: true,
  showsComponents: true,
  showsRetentionWords: true,
};

const newWord = { frequencyTier: FrequencyTier.HighIncidence };

describe('describeWordLists', () => {
  it('names shown lists in order', () => {
    expect(describeWordLists([2, 1], LISTS)).toBe('General Vocabulary, Nouns');
  });

  it('names hidden lists when the word is in no shown list', () => {
    expect(describeWordLists([3], LISTS)).toBe('In hidden list: Zhuyin');
    expect(describeWordLists([3, 4], LISTS)).toBe('In hidden lists: Zhuyin, Components');
    expect(describeWordLists([1, 3], LISTS)).toBe('General Vocabulary');
  });

  it('says when a word is in no list', () => {
    expect(describeWordLists([], LISTS)).toBe('Not in any list');
  });
});

describe('isShownInAllWords', () => {
  it('shows everything by default', () => {
    expect(isShownInAllWords(newWord, [3], LISTS, SHOW_ALL)).toBe(true);
  });

  it('hides zhuyin cards, components and Retention words when asked', () => {
    expect(
      isShownInAllWords(newWord, [3], LISTS, { ...SHOW_ALL, showsScriptStudyCards: false }),
    ).toBe(false);
    expect(isShownInAllWords(newWord, [4], LISTS, { ...SHOW_ALL, showsComponents: false })).toBe(
      false,
    );
    expect(isShownInAllWords(newWord, [1], LISTS, { ...SHOW_ALL, showsComponents: false })).toBe(
      true,
    );
    const retentionWord = { frequencyTier: FrequencyTier.Retention };
    expect(
      isShownInAllWords(retentionWord, [1], LISTS, { ...SHOW_ALL, showsRetentionWords: false }),
    ).toBe(false);
  });
});

describe('hasWordsInListKind', () => {
  it('finds whether any word is in a list of that kind', () => {
    expect(hasWordsInListKind([[1], [3]], LISTS, WordListKind.ScriptStudy)).toBe(true);
    expect(hasWordsInListKind([[1], [2]], LISTS, WordListKind.Components)).toBe(false);
  });
});
