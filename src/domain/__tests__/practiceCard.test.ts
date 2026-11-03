import { distinctPracticeCards } from '../practiceCard';
import { makeWord } from './testWords';

describe('distinctPracticeCards', () => {
  it('keeps one card per word, using the list meanings of the first entry', () => {
    const word = makeWord(1, { definitions: ['original'] });
    const otherWord = makeWord(2);
    const cards = distinctPracticeCards([
      { entryId: 10, word, definitionsOverride: ['list meaning'] },
      { entryId: 11, word },
      { entryId: 12, word: otherWord },
    ]);
    expect(cards.map((card) => card.word.id)).toEqual([1, 2]);
    expect(cards[0].definitions).toEqual(['list meaning']);
  });
});
