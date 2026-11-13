import { distinctCharacters, shouldOfferCharacterSplit } from '../compoundSplitting';
import { PartOfSpeech } from '../partOfSpeech';

const isHan = (character: string) => /\p{Script=Han}/u.test(character);

describe('distinctCharacters', () => {
  it('lists each character once with its first position', () => {
    expect(distinctCharacters('雜貨店', isHan)).toEqual([
      { character: '雜', position: 0 },
      { character: '貨', position: 1 },
      { character: '店', position: 2 },
    ]);
    expect(distinctCharacters('媽媽', isHan)).toEqual([{ character: '媽', position: 0 }]);
  });

  it('skips characters outside the script and single characters', () => {
    expect(distinctCharacters('T恤', isHan)).toEqual([{ character: '恤', position: 1 }]);
    expect(distinctCharacters('店', isHan)).toEqual([]);
  });
});

describe('shouldOfferCharacterSplit', () => {
  it('offers it for multi-character nouns in a splitting language only', () => {
    expect(shouldOfferCharacterSplit(true, '學生', [PartOfSpeech.Noun])).toBe(true);
    expect(shouldOfferCharacterSplit(true, '喜歡', [PartOfSpeech.Verb])).toBe(false);
    expect(shouldOfferCharacterSplit(true, '書', [PartOfSpeech.Noun])).toBe(false);
    expect(shouldOfferCharacterSplit(false, '學生', [PartOfSpeech.Noun])).toBe(false);
  });
});
