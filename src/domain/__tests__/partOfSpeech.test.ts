import {
  PART_OF_SPEECH_FLAGS,
  PartOfSpeech,
  hasPartOfSpeech,
  isPartOfSpeech,
} from '../partOfSpeech';

describe('PART_OF_SPEECH_FLAGS', () => {
  it('keeps the flags already stored in the bundled dictionary', () => {
    expect(PART_OF_SPEECH_FLAGS[PartOfSpeech.Noun]).toBe(1);
    expect(PART_OF_SPEECH_FLAGS[PartOfSpeech.Verb]).toBe(2);
    expect(PART_OF_SPEECH_FLAGS[PartOfSpeech.Adjective]).toBe(4);
  });

  it('gives every part of speech its own single bit', () => {
    const flags = Object.values(PART_OF_SPEECH_FLAGS);
    expect(new Set(flags).size).toBe(flags.length);
    flags.forEach((flag) => expect(flag & (flag - 1)).toBe(0));
  });
});

describe('hasPartOfSpeech', () => {
  it('reads one flag out of a combined mask', () => {
    const adverbAndConjunction =
      PART_OF_SPEECH_FLAGS[PartOfSpeech.Adverb] | PART_OF_SPEECH_FLAGS[PartOfSpeech.Conjunction];
    expect(hasPartOfSpeech(adverbAndConjunction, PartOfSpeech.Adverb)).toBe(true);
    expect(hasPartOfSpeech(adverbAndConjunction, PartOfSpeech.Conjunction)).toBe(true);
    expect(hasPartOfSpeech(adverbAndConjunction, PartOfSpeech.Noun)).toBe(false);
  });
});

describe('isPartOfSpeech', () => {
  it('accepts stored values, including ones with spaces', () => {
    expect(isPartOfSpeech('verb')).toBe(true);
    expect(isPartOfSpeech('measure word')).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(isPartOfSpeech('measureWord')).toBe(false);
    expect(isPartOfSpeech('')).toBe(false);
  });
});
