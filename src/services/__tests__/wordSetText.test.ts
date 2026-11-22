import { FrequencyTier } from '../../domain/frequencyTier';
import type { Word } from '../../domain/word';
import { WordSetTopic } from '../../domain/wordSets';
import {
  addWordSetsButtonLabel,
  describeWordSetAddition,
  wordSetChoiceLabel,
  wordSetOptions,
  wordSetPreviewButtonLabel,
  wordSetTopicLabel,
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
    addedAtMs: 0,
  };
  return {
    addedWords: Array.from({ length: addedCount }, () => word),
    addedNouns: [],
    alreadyHadCount,
    topicListName: 'Health-related words',
  };
}

describe('word set text', () => {
  it('labels a topic with its number of sets and how many were added', () => {
    expect(wordSetTopicLabel({ topic: WordSetTopic.Health, choices: [choice] })).toBe(
      'Health (1 set)',
    );
    const choices = [choice, { ...choice, isAdded: true }, choice];
    expect(wordSetTopicLabel({ topic: WordSetTopic.Travel, choices })).toBe(
      'Travel & transport (3 sets, 1 added)',
    );
  });

  it('labels a set with its size, and marks added sets', () => {
    expect(wordSetChoiceLabel(choice)).toBe('Cold/Flu (19 words)');
    expect(wordSetChoiceLabel({ ...choice, entryCount: 1, isAdded: true })).toBe(
      'Cold/Flu (1 word) · Added',
    );
  });

  it('counts the words still checked once some are unchecked in the preview', () => {
    expect(wordSetChoiceLabel(choice, 2)).toBe('Cold/Flu (17 of 19 words)');
    const options = wordSetOptions([choice], new Map([['cold-flu', 1]]));
    expect(options[0].label).toBe('Cold/Flu (18 of 19 words)');
  });

  it('labels the preview button with the checked words, or goes back when none are', () => {
    expect(wordSetPreviewButtonLabel(0)).toBe('Back to sets');
    expect(wordSetPreviewButtonLabel(1)).toBe('Choose 1 word');
    expect(wordSetPreviewButtonLabel(35)).toBe('Choose 35 words');
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
      'Added 2 words to Health-related words, General Vocabulary and their word-type lists. 1 word you already had was added to Health-related words.',
    );
  });

  it('only mentions the words the profile had when none were new', () => {
    expect(describeWordSetAddition(additionOf(0, 36))).toBe(
      'You already had all 36 words. They were added to Health-related words.',
    );
    expect(describeWordSetAddition(additionOf(0, 1))).toBe(
      'You already had this word. It was added to Health-related words.',
    );
  });
});
