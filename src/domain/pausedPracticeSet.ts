/**
 * A paused practice set, stored per list as JSON so the user can resume it later, even after the
 * app was closed.
 */
import type { PracticeSessionSnapshot } from './practiceSession';
import type { SessionTimerSnapshot } from './sessionTimer';

export interface PausedPracticeState {
  session: PracticeSessionSnapshot;
  timer: SessionTimerSnapshot;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIdList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item));
}

function isMissedCounts(value: unknown): value is [number, number][] {
  return Array.isArray(value) && value.every((pair) => isIdList(pair) && pair.length === 2);
}

function isSessionSnapshot(value: unknown): value is PracticeSessionSnapshot {
  return (
    isRecord(value) &&
    isIdList(value.wordIds) &&
    isIdList(value.queue) &&
    isIdList(value.completedWordIds) &&
    isIdList(value.learnedWordIds) &&
    isMissedCounts(value.missedCounts)
  );
}

function isTimerSnapshot(value: unknown): value is SessionTimerSnapshot {
  return (
    isRecord(value) &&
    typeof value.startedAtMs === 'number' &&
    typeof value.elapsedMs === 'number' &&
    (value.deckCompletedMs === undefined || typeof value.deckCompletedMs === 'number')
  );
}

export function serializePausedState(state: PausedPracticeState): string {
  return JSON.stringify(state);
}

/** Null when the stored text isn't a paused set, so a bad row is ignored rather than crashing. */
export function parsePausedState(serialized: string): PausedPracticeState | null {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    return null;
  }
  if (!isRecord(value) || !isSessionSnapshot(value.session) || !isTimerSnapshot(value.timer)) {
    return null;
  }
  return { session: value.session, timer: value.timer };
}
