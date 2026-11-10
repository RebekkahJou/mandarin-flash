import Papa from 'papaparse';

import type { PartOfSpeech } from '../domain/partOfSpeech';
import type { WordList } from '../domain/wordList';
import type { CsvColumn, CsvHeaderNames } from './csvFormat';
import { CSV_COLUMNS, acceptedHeaderNames, splitMeanings } from './csvFormat';
import type { DictionaryEntry } from './dictionaryLookup';
import { findReading, partsOfSpeechOf } from './dictionaryLookup';
import type { LanguageAdapter } from './languages/languageAdapter';
import { formatWordCount } from './wordCount';

/** Imported files are untrusted: these limits keep a bad file from freezing the phone. */
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 10_000;
const MAX_CELL_LENGTH = 500;

export interface CsvWordRow {
  rowNumber: number;
  /** Already normalized by the language, e.g. converted to Taiwan Traditional. */
  headword: string;
  meanings: string[];
  reading?: string;
}

export interface ParsedCsv {
  rows: CsvWordRow[];
  invalidRowNumbers: number[];
}

export class CsvTooLargeError extends Error {
  constructor() {
    super(`CSV files must be under ${MAX_CSV_BYTES / (1024 * 1024)} MB and ${MAX_CSV_ROWS} rows.`);
  }
}

/**
 * Maps header names to column positions; files without a header use the export order. A first
 * row counts as a header when it names the headword column.
 */
function columnPositions(
  firstRow: readonly string[],
  languageHeaders: CsvHeaderNames,
): { positions: Record<CsvColumn, number>; hasHeader: boolean } {
  const normalizedHeader = firstRow.map((cell) => cell.trim().toLowerCase());
  const headerPositionOf = (column: CsvColumn) => {
    const acceptedNames = acceptedHeaderNames(column, languageHeaders);
    return normalizedHeader.findIndex((cell) => acceptedNames.includes(cell));
  };
  const hasHeader = headerPositionOf('headword') >= 0;
  const positions = {} as Record<CsvColumn, number>;
  CSV_COLUMNS.forEach((column, defaultPosition) => {
    positions[column] = hasHeader ? headerPositionOf(column) : defaultPosition;
  });
  return { positions, hasHeader };
}

/** Undoes the apostrophe that csvExport adds in front of formula-like cells. */
const ESCAPED_FORMULA_CELL = /^'(?=[=+\-@])/;

function cellAt(row: readonly string[], position: number): string {
  if (position < 0) return '';
  return (row[position] ?? '').trim().replace(ESCAPED_FORMULA_CELL, '').slice(0, MAX_CELL_LENGTH);
}

export function parseWordCsv(
  csvText: string,
  languageBundle: LanguageAdapter,
  byteSize: number = csvText.length,
): ParsedCsv {
  if (byteSize > MAX_CSV_BYTES) throw new CsvTooLargeError();
  const { data } = Papa.parse<string[]>(csvText, { skipEmptyLines: 'greedy' });
  if (data.length > MAX_CSV_ROWS + 1) throw new CsvTooLargeError();
  if (data.length === 0) return { rows: [], invalidRowNumbers: [] };

  const { positions, hasHeader } = columnPositions(data[0], languageBundle.csvHeaders);
  const rows: CsvWordRow[] = [];
  const invalidRowNumbers: number[] = [];
  data.slice(hasHeader ? 1 : 0).forEach((row, index) => {
    const rowNumber = index + (hasHeader ? 2 : 1);
    const headwordCell = cellAt(row, positions.headword);
    if (!languageBundle.containsLanguageScript(headwordCell)) {
      invalidRowNumbers.push(rowNumber);
      return;
    }
    const readingCell = cellAt(row, positions.reading);
    rows.push({
      rowNumber,
      headword: languageBundle.normalizeHeadword(headwordCell),
      meanings: splitMeanings(cellAt(row, positions.meaning)),
      reading: readingCell ? languageBundle.normalizeReading(readingCell) : undefined,
    });
  });
  return { rows, invalidRowNumbers };
}

export interface ImportWordDraft {
  headword: string;
  variant?: string;
  reading: string;
  definitions: string[];
}

export interface CsvImportPlan {
  wordsToAdd: ImportWordDraft[];
  /** Already in the list (or repeated in the file); CSV import never creates duplicates. */
  skippedDuplicates: string[];
  /** Not in the dictionary and no meaning given in the file. */
  unknownCharacters: string[];
  /** Words to add that have no meaning of a part-of-speech list's type (e.g. a noun into Verbs). */
  partOfSpeechMismatches: string[];
  invalidRowNumbers: number[];
}

type LookUp = (headword: string) => Promise<DictionaryEntry[]>;

function chooseEntry(
  entries: readonly DictionaryEntry[],
  reading: string | undefined,
): DictionaryEntry | undefined {
  return findReading(entries, reading) ?? entries[0];
}

interface DraftedWord {
  draft: ImportWordDraft;
  fitsList: boolean;
}

async function draftWord(
  row: CsvWordRow,
  targetList: WordList,
  lookUp: LookUp,
  reliablePartsOfSpeech: readonly PartOfSpeech[],
): Promise<DraftedWord | null> {
  // Looked up even when the file has every column, to check the word fits the list.
  const entry = chooseEntry(await lookUp(row.headword), row.reading);
  const definitions =
    row.meanings.length > 0
      ? row.meanings
      : targetList.selectDefaultMeanings(entry?.definitionCandidates ?? []);
  if (definitions.length === 0) return null;
  return {
    draft: {
      headword: row.headword,
      variant: entry?.variant,
      reading: row.reading ?? entry?.reading ?? '',
      definitions,
    },
    fitsList:
      targetList.validateWord(partsOfSpeechOf(entry ? [entry] : []), reliablePartsOfSpeech) ===
      null,
  };
}

/** Works out what an import would do, so the user can review it before anything is saved. */
export async function planCsvImport(
  parsedCsv: ParsedCsv,
  targetList: WordList,
  headwordsAlreadyInList: ReadonlySet<string>,
  lookUp: LookUp,
  reliablePartsOfSpeech: readonly PartOfSpeech[],
): Promise<CsvImportPlan> {
  const plan: CsvImportPlan = {
    wordsToAdd: [],
    skippedDuplicates: [],
    unknownCharacters: [],
    partOfSpeechMismatches: [],
    invalidRowNumbers: [...parsedCsv.invalidRowNumbers],
  };
  const seenHeadwords = new Set(headwordsAlreadyInList);
  for (const row of parsedCsv.rows) {
    const { headword } = row;
    if (seenHeadwords.has(headword)) {
      plan.skippedDuplicates.push(headword);
      continue;
    }
    seenHeadwords.add(headword);
    const drafted = await draftWord(row, targetList, lookUp, reliablePartsOfSpeech);
    if (!drafted) {
      plan.unknownCharacters.push(headword);
      continue;
    }
    plan.wordsToAdd.push(drafted.draft);
    if (!drafted.fitsList) plan.partOfSpeechMismatches.push(headword);
  }
  return plan;
}

export interface ListImportPlan {
  listName: string;
  plan: CsvImportPlan;
}

function describeListPlan({ listName, plan }: ListImportPlan): string {
  const skipped =
    plan.skippedDuplicates.length > 0
      ? `, ${plan.skippedDuplicates.length} already there (skipped)`
      : '';
  const summary = `${listName}: ${formatWordCount(plan.wordsToAdd.length)} to add${skipped}.`;
  if (plan.partOfSpeechMismatches.length === 0) return summary;
  const mismatches = plan.partOfSpeechMismatches.join(', ');
  return `${summary}\n  Not a usual fit for ${listName}: ${mismatches}`;
}

/** One summary for an import into one or more lists, shown before anything is saved. */
export function describeImportPlans(listPlans: readonly ListImportPlan[]): string {
  const lines = listPlans.map(describeListPlan);
  const unknownCharacters = new Set(listPlans.flatMap(({ plan }) => plan.unknownCharacters));
  if (unknownCharacters.size > 0) {
    lines.push(
      `${unknownCharacters.size} not found and had no meaning: ${[...unknownCharacters].join(', ')}`,
    );
  }
  // Every list is planned from the same parsed file, so invalid rows are the same for each.
  const invalidRowNumbers = listPlans[0]?.plan.invalidRowNumbers ?? [];
  if (invalidRowNumbers.length > 0) {
    lines.push(`Rows without Chinese characters (skipped): ${invalidRowNumbers.join(', ')}`);
  }
  return lines.join('\n');
}
