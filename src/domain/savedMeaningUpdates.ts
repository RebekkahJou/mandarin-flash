/**
 * Saved words keep a copy of their meanings, so when the way a pack's meanings are shown changes
 * (e.g. dictionary cross-references made readable), saved copies are updated to match.
 */

/** A word's meanings, or a list entry's own meanings, identified by its row id. */
export interface SavedMeanings {
  id: number;
  meanings: string[];
}

/** The saved meanings that read differently after formatting, with their new text. */
export function planMeaningUpdates(
  saved: readonly SavedMeanings[],
  formatMeaning: (meaning: string) => string,
): SavedMeanings[] {
  return saved.flatMap(({ id, meanings }) => {
    const formatted = meanings.map(formatMeaning);
    const hasChanged = formatted.some((meaning, index) => meaning !== meanings[index]);
    return hasChanged ? [{ id, meanings: formatted }] : [];
  });
}
