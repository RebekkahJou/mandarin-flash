import { parsePausedState, parseWordIds, serializePausedState } from '../pausedPracticeSet';

const state = {
  session: {
    wordIds: [1, 2, 3],
    queue: [2, 3],
    completedWordIds: [1],
    learnedWordIds: [],
    missedCounts: [[2, 1]] as [number, number][],
  },
  timer: { startedAtMs: 1000, elapsedMs: 42_000 },
  isSavedSet: true,
};

describe('paused practice state', () => {
  it('round-trips through its stored text', () => {
    expect(parsePausedState(serializePausedState(state))).toEqual(state);
  });

  it('reads saved word ids, ignoring anything else', () => {
    expect(parseWordIds('[3, 1, 2]')).toEqual([3, 1, 2]);
    expect(parseWordIds('{"a": 1}')).toBeNull();
    expect(parseWordIds('oops')).toBeNull();
  });

  it('ignores text that is not a paused set', () => {
    expect(parsePausedState('not json')).toBeNull();
    expect(parsePausedState('{"session": {}, "timer": {}}')).toBeNull();
    const badQueue = { ...state, session: { ...state.session, queue: ['a'] } };
    expect(parsePausedState(JSON.stringify(badQueue))).toBeNull();
  });
});
