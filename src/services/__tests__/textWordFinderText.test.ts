import type { FoundWord, TextWordSearch } from '../textWordFinder';
import { MAX_SEARCHED_TEXT_LENGTH } from '../textWordFinder';
import {
  addFoundWordsButtonLabel,
  foundWordsNotes,
  foundWordsSummary,
} from '../textWordFinderText';

function foundWord(headword: string, isInProfile = false): FoundWord {
  return { entry: { headword, reading: '', definitionCandidates: [] }, isInProfile };
}

function search(overrides: Partial<TextWordSearch> = {}): TextWordSearch {
  return { words: [], unknownCharacters: [], wasShortened: false, ...overrides };
}

describe('foundWordsSummary', () => {
  it('says when nothing was found', () => {
    expect(foundWordsSummary(search())).toBe('No dictionary words found in this text.');
  });

  it('counts the words found', () => {
    expect(foundWordsSummary(search({ words: [foundWord('牛肉')] }))).toBe('Found 1 word.');
  });

  it('explains why words the profile has are unchecked', () => {
    const words = [foundWord('牛肉'), foundWord('好吃', true), foundWord('麵', true)];
    expect(foundWordsSummary(search({ words }))).toBe(
      'Found 3 words. 2 words you already have are unchecked.',
    );
  });
});

describe('foundWordsNotes', () => {
  it('has no notes for a plain search', () => {
    expect(foundWordsNotes(search())).toEqual([]);
  });

  it('lists unknown characters and a shortened text', () => {
    expect(
      foundWordsNotes(search({ unknownCharacters: ['滷', '𠮷'], wasShortened: true })),
    ).toEqual([
      'Not in the dictionary: 滷, 𠮷',
      `Only the first ${MAX_SEARCHED_TEXT_LENGTH} characters were searched.`,
    ]);
  });
});

describe('button and message text', () => {
  it('counts the checked words on the button', () => {
    expect(addFoundWordsButtonLabel(0)).toBe('Add words');
    expect(addFoundWordsButtonLabel(2)).toBe('Add 2 words');
  });
});
