import { PART_OF_SPEECH_FLAGS, PartOfSpeech } from '../../src/domain/partOfSpeech';
import { tagGloss } from '../lib/partOfSpeechTagger';

const VERB = PART_OF_SPEECH_FLAGS[PartOfSpeech.Verb];
const NOUN = PART_OF_SPEECH_FLAGS[PartOfSpeech.Noun];
const ADJECTIVE = PART_OF_SPEECH_FLAGS[PartOfSpeech.Adjective];
const NONE = 0;

describe('tagGloss', () => {
  it.each([
    ['to walk', false, VERB],
    ['(literary) to go', false, VERB],
    ['student', true, NOUN],
    ['restaurant', false, NOUN],
    ['pretty; beautiful', false, ADJECTIVE],
    ['very good', false, ADJECTIVE],
    ['dangerous', false, ADJECTIVE],
    ['surname Wang', false, NONE],
    ['classifier for rows or lines', false, NONE],
    ['from', false, NONE],
    ['quickly', false, NONE],
  ])('%s (has classifier: %s) → %i', (gloss, hasClassifier, expectedFlags) => {
    expect(tagGloss(gloss, hasClassifier)).toBe(expectedFlags);
  });
});
