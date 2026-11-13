import { FrequencyTier } from '../../domain/frequencyTier';
import type { StarterVocabularyStatus } from '../starterVocabulary';
import { describeStarterSetAddition, starterVocabularyCardText } from '../starterVocabularyText';

const NO_SETS_ADDED: StarterVocabularyStatus = {
  addedSets: [],
  next: { setNumber: 1, isUnlocked: true },
  setCount: 10,
  nextSetSize: 50,
};

describe('starterVocabularyCardText', () => {
  it('is hidden when the pack has no starter vocabulary', () => {
    expect(
      starterVocabularyCardText({ addedSets: [], next: null, setCount: 0, nextSetSize: 0 }),
    ).toBeNull();
  });

  it('offers the first set', () => {
    expect(starterVocabularyCardText(NO_SETS_ADDED)).toEqual({
      title: 'Starter vocabulary',
      progress: null,
      addLabel: 'Add 50 common words to start',
      note: null,
    });
  });

  it('shows progress and how many more words unlock the next set', () => {
    const latest = { setNumber: 2, setSize: 50, learnedCount: 38 };
    const text = starterVocabularyCardText({
      addedSets: [{ setNumber: 1, setSize: 50, learnedCount: 50 }, latest],
      next: { setNumber: 3, isUnlocked: false, learnedNeeded: 45, latest },
      setCount: 10,
      nextSetSize: 50,
    });
    expect(text).toMatchObject({
      progress: 'Set 2 of 10: 38 of 50 learned',
      addLabel: null,
      note: 'Learn 7 more from set 2 to unlock set 3.',
    });
  });

  it('offers the next set once unlocked, and says when every set is added', () => {
    const latest = { setNumber: 1, setSize: 50, learnedCount: 46 };
    const unlocked = starterVocabularyCardText({
      addedSets: [latest],
      next: { setNumber: 2, isUnlocked: true },
      setCount: 10,
      nextSetSize: 50,
    });
    expect(unlocked?.addLabel).toBe('Add next 50 starter words');
    const finished = starterVocabularyCardText({
      addedSets: [{ ...latest, setNumber: 10 }],
      next: null,
      setCount: 10,
      nextSetSize: 0,
    });
    expect(finished?.note).toBe('Every starter set is added.');
  });
});

describe('describeStarterSetAddition', () => {
  it('mentions words the profile already had', () => {
    const word = {
      id: 1,
      profileId: 1,
      headword: '我',
      reading: 'wo3',
      definitions: ['I'],
      frequencyTier: FrequencyTier.HighIncidence,
    };
    expect(
      describeStarterSetAddition({ addedWords: [word], addedNouns: [], alreadyHadCount: 0 }),
    ).toBe('Added 1 word to General Vocabulary and their word-type lists.');
    expect(
      describeStarterSetAddition({ addedWords: [], addedNouns: [], alreadyHadCount: 2 }),
    ).toContain('2 words you already had count toward the set.');
  });
});
