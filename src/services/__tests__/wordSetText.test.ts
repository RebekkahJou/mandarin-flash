import { FrequencyTier } from '../../domain/frequencyTier';
import type { Word } from '../../domain/word';
import {
  addWordSetsButtonLabel,
  describeWordSetAddition,
  wordSetChoiceLabel,
  wordSetOptions,
} from '../wordSetText';
import type { WordSetAddition } from '../wordSets';

const choice = { setId: 'cold-flu', title: 'Cold/Flu', entryCount: 19, isAdded: false };

function additionOf(addedCount: number, alreadyHadCount: number): WordSetAddition {
  const word: Word = {
    id: 1,
    profileId: 1,
    headword: '藥',
    reading: 'yao4',
    definitions: ['medicine'],
    frequencyTier: FrequencyTier.HighIncidence,
  };
  return {
    addedWords: Array.from({ length: addedCount }, () => word),
    addedNouns: [],
    alreadyHadCount,
    topicListName: 'Health-related words',
  };
}

describe('word set text', () => {
  it('labels a set with its size, and marks added sets', () => {
    expect(wordSetChoiceLabel(choice)).toBe('Cold/Flu (19 words)');
    expect(wordSetChoiceLabel({ ...choice, entryCount: 1, isAdded: true })).toBe(
      'Cold/Flu (1 word) · Added',
    );
  });

  it('lists sets still to add first and added sets greyed out at the bottom', () => {
    const options = wordSetOptions([
      { ...choice, setId: 'doctor', title: 'Doctor', isAdded: true },
      choice,
    ]);
    expect(options.map((option) => [option.value, option.isDisabled])).toEqual([
      ['cold-flu', false],
      ['doctor', true],
    ]);
  });

  it('labels the button by how many sets are chosen', () => {
    expect(addWordSetsButtonLabel(0)).toBe('Close');
    expect(addWordSetsButtonLabel(1)).toBe('Add 1 set');
    expect(addWordSetsButtonLabel(3)).toBe('Add 3 sets');
  });

  it('says how many words were new and how many the profile already had', () => {
    expect(describeWordSetAddition(additionOf(2, 0))).toBe(
      'Added 2 words to Health-related words, General Vocabulary and their word-type lists.',
    );
    expect(describeWordSetAddition(additionOf(2, 1))).toBe(
      'Added 2 words to Health-related words, General Vocabulary and their word-type lists. ' +
        '1 word you already had was added to Health-related words.',
    );
  });
});
