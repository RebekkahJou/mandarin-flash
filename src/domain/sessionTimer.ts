export type Clock = () => number;

export interface SessionTimes {
  startedAtMs: number;
  totalElapsedMs: number;
  /** Time until every card was first gotten or learned; undefined if the deck was never completed. */
  deckCompletedMs?: number;
}

/** Tracks time from start to End, and separately the time to first complete the whole deck. */
export class SessionTimer {
  private readonly clock: Clock;
  private readonly startedAtMs: number;
  private deckCompletedAtMs?: number;
  private endedAtMs?: number;

  constructor(clock: Clock = Date.now) {
    this.clock = clock;
    this.startedAtMs = clock();
  }

  elapsedMs(): number {
    return (this.endedAtMs ?? this.clock()) - this.startedAtMs;
  }

  markDeckCompleted(): void {
    this.deckCompletedAtMs ??= this.clock();
  }

  end(): SessionTimes {
    this.endedAtMs ??= this.clock();
    return {
      startedAtMs: this.startedAtMs,
      totalElapsedMs: this.endedAtMs - this.startedAtMs,
      deckCompletedMs:
        this.deckCompletedAtMs === undefined
          ? undefined
          : this.deckCompletedAtMs - this.startedAtMs,
    };
  }
}
