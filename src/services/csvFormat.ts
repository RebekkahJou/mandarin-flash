/** Shared by CSV import and export so a file exported here always imports back cleanly. */
export const CSV_COLUMNS = ['character', 'meaning', 'pinyin'] as const;
export type CsvColumn = (typeof CSV_COLUMNS)[number];

/** Meanings often contain ";" themselves (e.g. "row; line"), so a distinct separator is used. */
export const MEANING_SEPARATOR = ' / ';

export function joinMeanings(meanings: readonly string[]): string {
  return meanings.join(MEANING_SEPARATOR);
}

export function splitMeanings(cell: string): string[] {
  return cell
    .split('/')
    .map((meaning) => meaning.trim())
    .filter((meaning) => meaning.length > 0);
}
