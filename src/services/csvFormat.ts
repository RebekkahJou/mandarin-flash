/**
 * Column order shared by export and header-less import, so a file exported here always imports
 * back cleanly. Each language names the columns in its header row (e.g. "character", "pinyin").
 */
export const CSV_COLUMNS = ['headword', 'meaning', 'reading', 'added'] as const;
export type CsvColumn = (typeof CSV_COLUMNS)[number];
export type CsvHeaderNames = Readonly<Record<CsvColumn, string>>;

/** Language-neutral header names that import accepts for every language. */
const GENERIC_CSV_HEADERS: Readonly<Record<CsvColumn, readonly string[]>> = {
  headword: ['word', 'headword'],
  meaning: ['meaning'],
  reading: ['reading'],
  added: ['added', 'time added', 'date added'],
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

/** Time added as an ISO 8601 date and time in UTC, e.g. 2026-11-20T08:15:00.000Z. */
export function formatAddedTime(addedAtMs: number): string {
  return new Date(addedAtMs).toISOString();
}

/** Any date or date and time JavaScript reads; undefined when empty or unreadable. */
export function parseAddedTime(cell: string): number | undefined {
  if (cell === '') return undefined;
  const addedAtMs = Date.parse(cell);
  return Number.isFinite(addedAtMs) && addedAtMs >= 0 ? addedAtMs : undefined;
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
