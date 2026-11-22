import { resumePausedSetLabel } from '../pausedPracticeText';

describe('resumePausedSetLabel', () => {
  it('counts the cards still to answer out of the whole set', () => {
    const session = {
      wordIds: [1, 2, 3, 4],
      queue: [3, 4, 1],
      completedWordIds: [1, 2],
      learnedWordIds: [2],
      missedCounts: [],
    };
    expect(resumePausedSetLabel(session)).toBe('Resume paused set (3 of 4 cards left)');
  });
});
