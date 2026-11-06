import { PART_OF_SPEECH_FLAGS, PartOfSpeech } from '../../src/domain/partOfSpeech';
import { tagGloss } from '../lib/partOfSpeechTagger';

const VERB = PART_OF_SPEECH_FLAGS[PartOfSpeech.Verb];
const NOUN = PART_OF_SPEECH_FLAGS[PartOfSpeech.Noun];
const ADJECTIVE = PART_OF_SPEECH_FLAGS[PartOfSpeech.Adjective];
const ADVERB = PART_OF_SPEECH_FLAGS[PartOfSpeech.Adverb];
const CONJUNCTION = PART_OF_SPEECH_FLAGS[PartOfSpeech.Conjunction];
const PREPOSITION = PART_OF_SPEECH_FLAGS[PartOfSpeech.Preposition];
const PRONOUN = PART_OF_SPEECH_FLAGS[PartOfSpeech.Pronoun];
const MEASURE_WORD = PART_OF_SPEECH_FLAGS[PartOfSpeech.MeasureWord];
const PARTICLE = PART_OF_SPEECH_FLAGS[PartOfSpeech.Particle];
const NUMERAL = PART_OF_SPEECH_FLAGS[PartOfSpeech.Numeral];
const QUESTION_WORD = PART_OF_SPEECH_FLAGS[PartOfSpeech.QuestionWord];
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
  ])('%s (has classifier: %s) → %i', (gloss, hasClassifier, expectedFlags) => {
    expect(tagGloss(gloss, hasClassifier)).toBe(expectedFlags);
  });

  // Each of these used to fall through to "noun", hiding mismatches such as 應 in Nouns.
  it.each([
    ['should', VERB], // 應
    ['ought to', VERB], // 應
    ['(legal) shall', VERB], // 應
    ['(prefix) can; may; able to; -able', VERB], // 可
    ['can; to have the skill; to know how to', VERB], // 會
    ['but; however', CONJUNCTION], // 可
    ['thanks', NONE], // 謝謝
    ['thank you', NONE], // 謝謝
    ['from', PREPOSITION], // 走
    ['quickly', ADVERB],
    ['very', ADVERB],
    ['I; me; my', PRONOUN], // 我
    ['he; him', PRONOUN],
    ['what?', QUESTION_WORD],
    ['one; 1', NUMERAL],
    ['classifier for rows or lines', MEASURE_WORD],
    ['(particle used for emphasis) certainly; very', PARTICLE],
  ])('tags small grammatical words: %s → %i', (gloss, expectedFlags) => {
    expect(tagGloss(gloss, false)).toBe(expectedFlags);
  });

  it.each([
    ['May (month)', NOUN],
    ['will; willpower', NOUN],
  ])('keeps nouns that look like modal verbs: %s', (gloss, expectedFlags) => {
    expect(tagGloss(gloss, false)).toBe(expectedFlags);
  });
});
