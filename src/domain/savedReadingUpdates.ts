/**
 * When a language pack's readings change (e.g. Traditional Mandarin switching to Taiwan readings),
 * words a profile already saved are given the new reading, so adding the word again doesn't store
 * a second copy.
 */

/** One reading of a headword in the pack, and the reading it replaced (empty if none). */
export interface PackReading {
  reading: string;
  replacedReading: string;
}

export interface SavedWordReading {
  wordId: number;
  headword: string;
  reading: string;
}

export interface ReadingUpdate {
  wordId: number;
  newReading: string;
}

/**
 * A saved word gets a new reading only when its reading is no longer one of the headword's
 * readings and exactly one current reading replaced it. A word whose reading is still valid
 * (another meaning keeps it) or that the pack doesn't know is left alone.
 */
export function planReadingUpdates(
  savedWords: readonly SavedWordReading[],
  packReadingsByHeadword: ReadonlyMap<string, readonly PackReading[]>,
): ReadingUpdate[] {
  return savedWords.flatMap(({ wordId, headword, reading }) => {
    const packReadings = packReadingsByHeadword.get(headword);
    if (!packReadings || packReadings.some((packReading) => packReading.reading === reading)) {
      return [];
    }
    const replacements = new Set(
      packReadings
        .filter((packReading) => packReading.replacedReading === reading)
        .map((packReading) => packReading.reading),
    );
    if (replacements.size !== 1) return [];
    const [newReading] = replacements;
    return newReading === undefined ? [] : [{ wordId, newReading }];
  });
}
