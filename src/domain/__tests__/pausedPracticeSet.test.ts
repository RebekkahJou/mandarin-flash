import { parsePausedState, serializePausedState } from '../pausedPracticeSet';

const state = {
  session: {
    wordIds: [1, 2, 3],
    queue: [2, 3],
    completedWordIds: [1],
    learnedWordIds: [],
    missedCounts: [[2, 1]] as [number, number][],
  },
  timer: { startedAtMs: 1000, elapsedMs: 42_000 },
};

describe('paused practice state', () => {
  it('round-trips through its stored text', () => {
    expect(parsePausedState(serializePausedState(state))).toEqual(state);
  });

  it('ignores text that is not a paused set', () => {
    expect(parsePausedState('not json')).toBeNull();
    expect(parsePausedState('{"session": {}, "timer": {}}')).toBeNull();
    const badQueue = { ...state, session: { ...state.session, queue: ['a'] } };
    expect(parsePausedState(JSON.stringify(badQueue))).toBeNull();
  });
});
