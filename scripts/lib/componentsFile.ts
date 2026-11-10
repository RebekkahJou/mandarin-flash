import type Database from 'better-sqlite3';

import type { PackComponentRow } from '../../src/data/packSchema';
import { COMPONENTS_TABLE_SQL } from '../../src/data/packSchema';

const HEADER = ['component', 'variant', 'name', 'reading', 'meaning'];
const NUMBERED_READING_PATTERN = /^([a-z:]+[1-5])( [a-z:]+[1-5])*$/;

/**
 * Parses a tab-separated components file (scripts/data/<language>-components.tsv): a header row,
 * then component, variant (empty when identical), name, numbered reading and meaning.
 */
export function parseComponentsFile(text: string): PackComponentRow[] {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (headerLine?.split('\t').join() !== HEADER.join()) {
    throw new Error(`The first line must be: ${HEADER.join(' <tab> ')}`);
  }
  const seen = new Set<string>();
  return lines.map((line, index) => {
    const [component, variant = '', name, reading, meaning] = line.split('\t');
    const lineNumber = index + 2;
    if (!component || !name || !meaning || !NUMBERED_READING_PATTERN.test(reading ?? '')) {
      throw new Error(`Line ${lineNumber} needs a component, name, numbered reading and meaning.`);
    }
    const key = `${component} ${reading}`;
    if (seen.has(key)) throw new Error(`Line ${lineNumber} repeats ${key}.`);
    seen.add(key);
    return { component, variant, name, reading, meaning };
  });
}

/** Replaces the pack's components, creating the table in a pack built before schema 2. */
export function writeComponents(
  database: Database.Database,
  components: readonly PackComponentRow[],
): void {
  const hasTable = database
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'components'")
    .get();
  database.transaction(() => {
    if (!hasTable) database.exec(COMPONENTS_TABLE_SQL);
    database.exec('DELETE FROM components');
    // Prepared only now, since the table may have just been created.
    const insert = database.prepare(
      `INSERT INTO components (position, component, variant, name, reading, meaning)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    components.forEach((row, index) =>
      insert.run(index + 1, row.component, row.variant, row.name, row.reading, row.meaning),
    );
  })();
}
