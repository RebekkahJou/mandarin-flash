import { englishMeaningKeys, pairSharedWords } from '../sharedWords';
import { makeWord } from './testWords';

describe('englishMeaningKeys', () => {
  it('drops brackets, a leading "to" or article, case and outer punctuation', () => {
    expect(englishMeaningKeys(['To restart (a device)', 'the Cloud.'])).toEqual([
      'restart',
      'cloud',
    ]);
  });

  it('splits meanings joined with semicolons and leaves out duplicates and blanks', () => {
    expect(englishMeaningKeys(['scam; fraud', 'fraud', '(computer)'])).toEqual(['scam', 'fraud']);
  });
});

describe('pairSharedWords', () => {
  const byHeadword = (word: { headword: string }) => [word.headword];

  it('pairs words with a shared key, each word at most once', () => {
    const firstWords = [
      makeWord(1, { headword: '老師' }),
      makeWord(2, { headword: '老師' }),
      makeWord(3, { headword: '學生' }),
    ];
    const secondWords = [makeWord(11, { headword: '老師' }), makeWord(12, { headword: '電腦' })];
    const pairs = pairSharedWords(firstWords, secondWords, byHeadword, byHeadword);
    expect(pairs.map(({ first, second }) => [first.id, second.id])).toEqual([[1, 11]]);
  });

  it('matches on any shared key, with different keys per side', () => {
    const firstWords = [makeWord(1, { definitions: ['scam; fraud'] })];
    const secondWords = [makeWord(11, { definitions: ['Fraud'] })];
    const meaningKeys = (word: { definitions: string[] }) => englishMeaningKeys(word.definitions);
    const pairs = pairSharedWords(firstWords, secondWords, meaningKeys, meaningKeys);
    expect(pairs).toHaveLength(1);
  });
});
