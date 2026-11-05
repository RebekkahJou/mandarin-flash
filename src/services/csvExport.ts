import Papa from 'papaparse';

import type { WordListEntry } from '../domain/wordList';
import { definitionsForEntry } from '../domain/wordList';
import { CSV_COLUMNS, joinMeanings } from './csvFormat';
import type { LanguageModule } from './languages/languageModule';

/** Characters that make spreadsheet apps treat a cell as a formula (CSV injection). */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function escapeFormulaCell(cell: string): string {
  return FORMULA_TRIGGER.test(cell) ? `'${cell}` : cell;
}

/** Builds "character, meaning, pinyin" CSV text for one word list, using its per-list meanings. */
export function buildWordListCsv(
  entries: readonly WordListEntry[],
  languageModule: LanguageModule,
): string {
  const rows = entries.map((entry) =>
    [
      entry.word.headword,
      joinMeanings(definitionsForEntry(entry)),
      languageModule.formatReading(entry.word.reading),
    ].map(escapeFormulaCell),
  );
  return Papa.unparse({ fields: [...CSV_COLUMNS], data: rows });
}

/** A safe file name: list names are user-entered, so anything unusual is replaced. */
export function csvFileNameForList(listName: string): string {
  const safeName = listName.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '');
  return `${safeName || 'word-list'}.csv`;
}
