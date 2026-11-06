import Papa from 'papaparse';

import type { WordListEntry } from '../domain/wordList';
import { definitionsForEntry } from '../domain/wordList';
import { exportHeaderRow, joinMeanings } from './csvFormat';
import type { LanguageAdapter } from './languages/languageAdapter';

/** Characters that make spreadsheet apps treat a cell as a formula (CSV injection). */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function escapeFormulaCell(cell: string): string {
  return FORMULA_TRIGGER.test(cell) ? `'${cell}` : cell;
}

/** Builds headword, meaning, reading CSV text for one word list, using its per-list meanings. */
export function buildWordListCsv(
  entries: readonly WordListEntry[],
  languageBundle: LanguageAdapter,
): string {
  const rows = entries.map((entry) =>
    [
      entry.word.headword,
      joinMeanings(definitionsForEntry(entry)),
      languageBundle.formatReading(entry.word.reading),
    ].map(escapeFormulaCell),
  );
  return Papa.unparse({ fields: exportHeaderRow(languageBundle.csvHeaders), data: rows });
}

/** A safe file name: list names are user-entered, so anything unusual is replaced. */
export function csvFileNameForList(listName: string): string {
  const safeName = listName.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '');
  return `${safeName || 'word-list'}.csv`;
}
