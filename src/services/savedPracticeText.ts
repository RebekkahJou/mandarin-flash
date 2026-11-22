/** Text for saved practice sets: the Practice tab button, the times list and replacing a set. */
import { formatWordCount } from './wordCount';

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

/** "3:07": minutes and seconds. */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / MILLISECONDS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const REPLACE_SAVED_TITLE = 'Replace the saved set?';
export const REPLACE_SAVED_MESSAGE =
  'This list already has a saved set. Saving this one replaces it and clears its times.';
export const REPLACE_SAVED_LABEL = 'Replace';

export function practiceSavedSetLabel(wordCount: number): string {
  return `Practice saved set (${formatWordCount(wordCount)})`;
}

/** The saved set's times to get every word, newest first. */
export function savedSetTimesText(timesMs: readonly number[]): string {
  if (timesMs.length === 0) {
    return 'No times yet. Get every word in the saved set to record one.';
  }
  return `Times to get every word, newest first: ${timesMs.map(formatDuration).join(', ')}`;
}
