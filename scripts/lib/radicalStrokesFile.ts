import type Database from 'better-sqlite3';

import { CHARACTERS_TABLE_SQL } from '../../src/data/packSchema';
import type { RadicalPosition } from '../../src/domain/wordSort';

/**
 * scripts/data/mandarin-radical-strokes.tsv: each character the Mandarin pack uses, with its
 * Kangxi radical and strokes after the radical, from Unicode's Unihan database (kRSUnicode,
 * Unicode License v3). The pack scripts write it into the pack's characters table.
 */

const HEADER = ['character', 'radical', 'remaining_strokes'];
const RADICAL_STROKE_FIELD = 'kRSUnicode';
/** "149.7", or "149'.7" for a simplified form of the radical; the first value is the main one. */
const RADICAL_STROKE_VALUE = /^(\d+)'*\.(-?\d+)$/;
const CODE_POINT_FIELD = /^U\+([0-9A-F]{4,6})$/;
const MAX_RADICAL = 214;

export type RadicalStrokes = ReadonlyMap<string, RadicalPosition>;

function parseRadicalStrokeValue(value: string): RadicalPosition | null {
  const [mainValue = ''] = value.trim().split(/\s+/);
  const match = RADICAL_STROKE_VALUE.exec(mainValue);
  if (!match) return null;
  const radical = Number(match[1]);
  if (radical < 1 || radical > MAX_RADICAL) return null;
  return { radical, remainingStrokes: Number(match[2]) };
}

/** Reads kRSUnicode lines from Unihan_IRGSources.txt; other lines and fields are skipped. */
export function parseUnihanRadicalStrokes(text: string): Map<string, RadicalPosition> {
  const positions = new Map<string, RadicalPosition>();
  for (const line of text.split(/\r?\n/)) {
    const [codePointField = '', field, value = ''] = line.split('\t');
    if (field !== RADICAL_STROKE_FIELD) continue;
    const codePoint = CODE_POINT_FIELD.exec(codePointField);
    const position = parseRadicalStrokeValue(value);
    if (!codePoint?.[1] || !position) continue;
    positions.set(String.fromCodePoint(parseInt(codePoint[1], 16)), position);
  }
  return positions;
}

export function formatRadicalStrokesFile(positions: RadicalStrokes): string {
  const lines = [...positions]
    .sort(([first], [second]) => (first.codePointAt(0) ?? 0) - (second.codePointAt(0) ?? 0))
    .map(([character, { radical, remainingStrokes }]) =>
      [character, radical, remainingStrokes].join('\t'),
    );
  return [HEADER.join('\t'), ...lines].join('\n') + '\n';
}

export function parseRadicalStrokesFile(text: string): Map<string, RadicalPosition> {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (headerLine?.split('\t').join() !== HEADER.join()) {
    throw new Error(`The first line must be: ${HEADER.join(' <tab> ')}`);
  }
  const positions = new Map<string, RadicalPosition>();
  lines.forEach((line, index) => {
    const [character = '', radical, remainingStrokes] = line.split('\t');
    const position = { radical: Number(radical), remainingStrokes: Number(remainingStrokes) };
    const isValid =
      [...character].length === 1 &&
      Number.isInteger(position.radical) &&
      Number.isInteger(position.remainingStrokes);
    if (!isValid) throw new Error(`Line ${index + 2} needs a character and two whole numbers.`);
    positions.set(character, position);
  });
  return positions;
}

/** Replaces the pack's characters table (creating it in packs built before schema 5). */
export function writeCharacters(database: Database.Database, positions: RadicalStrokes): void {
  database.exec('DROP TABLE IF EXISTS characters');
  database.exec(CHARACTERS_TABLE_SQL);
  const insert = database.prepare(
    'INSERT INTO characters (character, radical, remaining_strokes) VALUES (?, ?, ?)',
  );
  database.transaction(() => {
    for (const [character, { radical, remainingStrokes }] of positions) {
      insert.run(character, radical, remainingStrokes);
    }
  })();
}
