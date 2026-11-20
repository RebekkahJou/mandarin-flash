export type Clock = () => number;

export interface SessionTimes {
  startedAtMs: number;
  /** Time spent practicing until End, paused time left out. */
  totalElapsedMs: number;
  /** Time until every card was first gotten or learned; undefined if the deck was never completed. */
  deckCompletedMs?: number;
}

/** What a paused timer keeps, so it can carry on from the same time later. */
export interface SessionTimerSnapshot {
  startedAtMs: number;
  elapsedMs: number;
  deckCompletedMs?: number;
}

/**
 * Tracks practice time from start to End, and separately the time to first complete the whole
 * deck. Time stops while the set is paused.
 */
export class SessionTimer {
  private readonly clock: Clock;
  private readonly startedAtMs: number;
  private accumulatedMs: number;
  /** When the timer last started or resumed; undefined while paused or ended. */
  private runningSinceMs?: number;
  private deckCompletedMs?: number;

  constructor(clock: Clock = Date.now, snapshot?: SessionTimerSnapshot) {
    this.clock = clock;
    this.startedAtMs = snapshot?.startedAtMs ?? clock();
    this.accumulatedMs = snapshot?.elapsedMs ?? 0;
    this.deckCompletedMs = snapshot?.deckCompletedMs;
    this.runningSinceMs = clock();
  }

  elapsedMs(): number {
    const runningMs = this.runningSinceMs === undefined ? 0 : this.clock() - this.runningSinceMs;
    return this.accumulatedMs + runningMs;
  }

  markDeckCompleted(): void {
    this.deckCompletedMs ??= this.elapsedMs();
  }

  pause(): void {
    this.accumulatedMs = this.elapsedMs();
    this.runningSinceMs = undefined;
  }

  resume(): void {
    this.runningSinceMs ??= this.clock();
  }

  toSnapshot(): SessionTimerSnapshot {
    return {
      startedAtMs: this.startedAtMs,
      elapsedMs: this.elapsedMs(),
      deckCompletedMs: this.deckCompletedMs,
    };
  }

  end(): SessionTimes {
    this.pause();
    return {
      startedAtMs: this.startedAtMs,
      totalElapsedMs: this.accumulatedMs,
      deckCompletedMs: this.deckCompletedMs,
    };
  }
}
