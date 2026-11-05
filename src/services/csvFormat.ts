/**
 * Column order shared by export and header-less import, so a file exported here always imports
 * back cleanly. Each language names the columns in its header row (e.g. "character", "pinyin").
 */
export const CSV_COLUMNS = ['headword', 'meaning', 'reading'] as const;
export type CsvColumn = (typeof CSV_COLUMNS)[number];
export type CsvHeaderNames = Readonly<Record<CsvColumn, string>>;

/** Language-neutral header names that import accepts for every language. */
const GENERIC_CSV_HEADERS: Readonly<Record<CsvColumn, readonly string[]>> = {
  headword: ['word', 'headword'],
  meaning: ['meaning'],
  reading: ['reading'],
};

/** Lower-case header names that identify a column on import: the language's own, then generic. */
export function acceptedHeaderNames(column: CsvColumn, languageHeaders: CsvHeaderNames): string[] {
  return [languageHeaders[column], ...GENERIC_CSV_HEADERS[column]].map((name) =>
    name.toLowerCase(),
  );
}

export function exportHeaderRow(languageHeaders: CsvHeaderNames): string[] {
  return CSV_COLUMNS.map((column) => languageHeaders[column]);
}

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
