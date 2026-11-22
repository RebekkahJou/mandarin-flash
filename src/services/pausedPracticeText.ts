/** Text for resuming or discarding a paused practice set on the Practice tab. */
import type { PracticeSessionSnapshot } from '../domain/practiceSession';

export const DISCARD_PAUSED_TITLE = 'Discard the paused set?';
export const DISCARD_PAUSED_MESSAGE =
  'This list has a paused practice set. Starting a new set discards it.';
export const DISCARD_PAUSED_LABEL = 'Start new set';

/** "Resume paused set (12 of 20 cards left)". */
export function resumePausedSetLabel(session: PracticeSessionSnapshot): string {
  const remainingCount = session.queue.length;
  const cardCount = session.wordIds.length;
  return `Resume paused set (${remainingCount} of ${cardCount} cards left)`;
}
