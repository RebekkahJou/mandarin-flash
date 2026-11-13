import type Database from 'better-sqlite3';

import type { TaiwanReadingPair } from './wiktionaryTaiwanReadings';

/**
 * scripts/data/mandarin-taiwan-readings.tsv: words read differently in Taiwan and on the
 * mainland, from Wiktionary (CC BY-SA). Traditional Mandarin always uses the Taiwan reading; the
 * mainland one becomes the variant reading that Simplified uses.
 */

const HEADER = ['headword', 'mainland_reading', 'taiwan_reading'];
const NUMBERED_READING_PATTERN = /^[a-z:]+[1-5]( [a-z:]+[1-5])*$/;
/**
 * Directional complements (起來, 下去): toned on their own in Taiwan, but neutral after a verb
 * (站起來 zhàn qi lai), so they aren't swapped inside longer words.
 */
const DIRECTIONAL_COMPLEMENT = /^[起上下進出回過開]?[來去]$/;

export function formatTaiwanReadingsFile(pairs: readonly TaiwanReadingPair[]): string {
  const lines = pairs.map((pair) =>
    [pair.headword, pair.mainlandReading, pair.taiwanReading].join('\t'),
  );
  return [HEADER.join('\t'), ...lines].join('\n') + '\n';
}

export function parseTaiwanReadingsFile(text: string): TaiwanReadingPair[] {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (headerLine?.split('\t').join() !== HEADER.join()) {
    throw new Error(`The first line must be: ${HEADER.join(' <tab> ')}`);
  }
  return lines.map((line, index) => {
    const [headword, mainlandReading = '', taiwanReading = ''] = line.split('\t');
    const isValid =
      Boolean(headword) &&
      NUMBERED_READING_PATTERN.test(mainlandReading) &&
      NUMBERED_READING_PATTERN.test(taiwanReading);
    if (!isValid || !headword) {
      throw new Error(`Line ${index + 2} needs a headword and two numbered readings.`);
    }
    return { headword, mainlandReading, taiwanReading };
  });
}

/** Taiwan readings by headword and mainland reading. */
export type TaiwanReadingIndex = ReadonlyMap<string, ReadonlyMap<string, string>>;

export function indexTaiwanReadings(pairs: readonly TaiwanReadingPair[]): TaiwanReadingIndex {
  const index = new Map<string, Map<string, string>>();
  for (const { headword, mainlandReading, taiwanReading } of pairs) {
    const readings = index.get(headword) ?? new Map<string, string>();
    readings.set(mainlandReading, taiwanReading);
    index.set(headword, readings);
  }
  return index;
}

/**
 * Gives each dictionary entry its Taiwan reading (see withTaiwanReadings), keeping the mainland
 * one as its variant reading. An entry can end up with the same reading as another entry of the
 * headword (地方 dì fang "place" and dì fāng "local"); the app merges them when it reads the pack.
 * Running it again changes nothing. Returns how many entries changed.
 */
export function applyTaiwanReadings(
  database: Database.Database,
  pairs: readonly TaiwanReadingPair[],
): number {
  const index = indexTaiwanReadings(pairs);
  const rows = database
    .prepare<[], { id: number; headword: string; reading: string }>(
      'SELECT id, headword, reading FROM entries',
    )
    .all();
  const update = database.prepare(
    `UPDATE entries SET reading = ?,
       variant_reading = CASE WHEN variant_reading = '' THEN ? ELSE variant_reading END
     WHERE id = ?`,
  );
  let updatedCount = 0;
  database.transaction(() => {
    for (const { id, headword, reading } of rows) {
      const taiwanReading = withTaiwanReadings(headword, reading, index);
      if (taiwanReading === reading) continue;
      update.run(taiwanReading, reading, id);
      updatedCount++;
    }
  })();
  return updatedCount;
}

/**
 * A reading with Taiwan readings swapped in: the whole word when it is listed, else each listed
 * word inside it (舒服 in 我不舒服), longest first. Readings must have one syllable per
 * character, otherwise the reading is returned unchanged.
 */
export function withTaiwanReadings(
  headword: string,
  reading: string,
  index: TaiwanReadingIndex,
): string {
  const whole = index.get(headword)?.get(reading);
  if (whole) return whole;
  const characters = Array.from(headword);
  const syllables = reading.split(' ');
  if (characters.length !== syllables.length) return reading;
  let position = 0;
  while (position < characters.length) {
    position += replaceLongestWordAt(characters, syllables, position, index);
  }
  return syllables.join(' ');
}

/** Replaces the longest listed word starting at position; returns how many characters it used. */
function replaceLongestWordAt(
  characters: readonly string[],
  syllables: string[],
  position: number,
  index: TaiwanReadingIndex,
): number {
  for (let length = characters.length - position; length >= 2; length--) {
    const word = characters.slice(position, position + length).join('');
    if (DIRECTIONAL_COMPLEMENT.test(word)) continue;
    const mainland = syllables.slice(position, position + length).join(' ');
    const taiwan = index.get(word)?.get(mainland);
    if (!taiwan) continue;
    syllables.splice(position, length, ...taiwan.split(' '));
    return length;
  }
  return 1;
}
