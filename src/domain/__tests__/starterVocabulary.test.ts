import { FrequencyTier } from '../frequencyTier';
import { PartOfSpeech } from '../partOfSpeech';
import {
  StarterWordGroup,
  isStarterWordLearned,
  isStarterWordType,
  learnedNeededToUnlock,
  listForStarterWordType,
  nextStarterSet,
} from '../starterVocabulary';

const ALL_SETS = [1, 2, 3];
const MEASURE_WORDS = [{ name: 'Measure words', partOfSpeech: PartOfSpeech.MeasureWord }];

describe('isStarterWordType', () => {
  it('accepts parts of speech, phrases and time words only', () => {
    expect(isStarterWordType('noun')).toBe(true);
    expect(isStarterWordType('phrase')).toBe(true);
    expect(isStarterWordType('time word')).toBe(true);
    expect(isStarterWordType('gerund')).toBe(false);
  });
});

describe('isStarterWordLearned', () => {
  it('counts words below High incidence as learned', () => {
    expect(isStarterWordLearned(FrequencyTier.HighIncidence)).toBe(false);
    expect(isStarterWordLearned(FrequencyTier.MemoryReinforcement)).toBe(true);
    expect(isStarterWordLearned(FrequencyTier.Retention)).toBe(true);
  });
});

describe('nextStarterSet', () => {
  it('offers set 1 to a profile that has no starter words', () => {
    expect(nextStarterSet([], ALL_SETS)).toEqual({ setNumber: 1, isUnlocked: true });
  });

  it('unlocks the next set once 90% of the latest set is learned', () => {
    expect(learnedNeededToUnlock(50)).toBe(45);
    const latest = { setNumber: 1, setSize: 50, learnedCount: 45 };
    expect(nextStarterSet([latest], ALL_SETS)).toEqual({ setNumber: 2, isUnlocked: true });
  });

  it('keeps the next set locked and says how many words are needed', () => {
    const latest = { setNumber: 2, setSize: 50, learnedCount: 38 };
    const earlier = { setNumber: 1, setSize: 50, learnedCount: 50 };
    expect(nextStarterSet([earlier, latest], ALL_SETS)).toEqual({
      setNumber: 3,
      isUnlocked: false,
      learnedNeeded: 45,
      latest,
    });
  });

  it('returns null once every set is added', () => {
    const added = ALL_SETS.map((setNumber) => ({ setNumber, setSize: 50, learnedCount: 0 }));
    expect(nextStarterSet(added, ALL_SETS)).toBeNull();
  });

  it('returns null when the pack has no starter sets', () => {
    expect(nextStarterSet([], [])).toBeNull();
  });
});

describe('listForStarterWordType', () => {
  it('uses the default or suggested list for a part of speech', () => {
    expect(listForStarterWordType(PartOfSpeech.Noun, MEASURE_WORDS)).toEqual({
      name: 'Nouns',
      partOfSpeech: PartOfSpeech.Noun,
    });
    expect(listForStarterWordType(PartOfSpeech.MeasureWord, MEASURE_WORDS).name).toBe(
      'Measure words',
    );
    expect(listForStarterWordType(PartOfSpeech.Pronoun, MEASURE_WORDS).name).toBe('Pronouns');
  });

  it('puts phrases and time words in their own general lists', () => {
    expect(listForStarterWordType(StarterWordGroup.Phrase, [])).toEqual({ name: 'Phrases' });
    expect(listForStarterWordType(StarterWordGroup.TimeWord, [])).toEqual({ name: 'Time words' });
  });

  it('names a list after the word type when no language list matches', () => {
    expect(listForStarterWordType(PartOfSpeech.MeasureWord, [])).toEqual({
      name: 'Measure words',
      partOfSpeech: PartOfSpeech.MeasureWord,
    });
  });
});
