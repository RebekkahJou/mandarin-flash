/**
 * Writes scripts/data/mandarin-radical-strokes.tsv: the radical and remaining strokes of every
 * character the Mandarin pack uses (headwords, variants, starter words, components and word set
 * entries), from Unicode's Unihan database. Run on a developer machine only:
 *
 *   npm run extract:radical-strokes -- <Unihan_IRGSources.txt>
 *
 * Download Unihan.zip from unicode.org/Public/UCD/latest/ucd/ (Unicode License v3; see
 * docs/THIRD_PARTY.md). Then run `npm run update:mandarin-curated-data` to write it into the pack.
 */
import Database from 'better-sqlite3';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { MANDARIN_PACK_PATH, MANDARIN_RADICAL_STROKES_PATH } from './lib/mandarinPack';
import { formatRadicalStrokesFile, parseUnihanRadicalStrokes } from './lib/radicalStrokesFile';

const HAN_CHARACTER = /\p{Script=Han}/u;

const PACK_TEXT_QUERIES = [
  'SELECT headword AS text FROM entries UNION SELECT variant FROM entries',
  'SELECT headword AS text FROM starter_words',
  'SELECT component AS text FROM components UNION SELECT variant FROM components',
  'SELECT headword AS text FROM word_set_entries UNION SELECT variant FROM word_set_entries',
];

function packCharacters(): Set<string> {
  const database = new Database(MANDARIN_PACK_PATH, { readonly: true });
  const characters = new Set<string>();
  for (const query of PACK_TEXT_QUERIES) {
    for (const { text } of database.prepare<[], { text: string }>(query).all()) {
      for (const character of text) {
        if (HAN_CHARACTER.test(character)) characters.add(character);
      }
    }
  }
  database.close();
  return characters;
}

function main(): void {
  const unihanPath = process.argv[2];
  if (!unihanPath || !existsSync(unihanPath)) {
    console.error('Usage: npm run extract:radical-strokes -- <Unihan_IRGSources.txt>');
    process.exit(1);
  }
  const unihan = parseUnihanRadicalStrokes(readFileSync(unihanPath, 'utf8'));
  const characters = packCharacters();
  const positions = new Map(
    [...characters].flatMap((character) => {
      const position = unihan.get(character);
      return position ? [[character, position] as const] : [];
    }),
  );
  writeFileSync(MANDARIN_RADICAL_STROKES_PATH, formatRadicalStrokesFile(positions));
  const missing = characters.size - positions.size;
  console.log(
    `Wrote ${positions.size} of the pack's ${characters.size} characters (${missing} have no radical data).`,
  );
}

main();
