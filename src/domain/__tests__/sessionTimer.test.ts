import { SessionTimer } from '../sessionTimer';

function fakeClock(startMs: number) {
  let nowMs = startMs;
  return {
    clock: () => nowMs,
    advance: (deltaMs: number) => {
      nowMs += deltaMs;
    },
  };
}

describe('SessionTimer', () => {
  it('measures total time from start to End', () => {
    const { clock, advance } = fakeClock(1000);
    const timer = new SessionTimer(clock);
    advance(90_000);
    expect(timer.end()).toEqual({
      startedAtMs: 1000,
      totalElapsedMs: 90_000,
      deckCompletedMs: undefined,
    });
  });

  it('records deck completion time separately and only the first time', () => {
    const { clock, advance } = fakeClock(0);
    const timer = new SessionTimer(clock);
    advance(60_000);
    timer.markDeckCompleted();
    advance(10_000);
    timer.markDeckCompleted();
    advance(30_000);
    const times = timer.end();
    expect(times.deckCompletedMs).toBe(60_000);
    expect(times.totalElapsedMs).toBe(100_000);
  });

  it('stops counting after End', () => {
    const { clock, advance } = fakeClock(0);
    const timer = new SessionTimer(clock);
    advance(5000);
    timer.end();
    advance(5000);
    expect(timer.elapsedMs()).toBe(5000);
  });
});
