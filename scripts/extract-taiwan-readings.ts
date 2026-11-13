/**
 * Writes scripts/data/mandarin-taiwan-readings.tsv from Wiktionary's Chinese entries, keeping
 * words the Mandarin pack has whose Taiwan reading differs from the mainland one. Run on a
 * developer machine only:
 *
 *   npm run extract:taiwan-readings -- <kaikki.org-dictionary-Chinese.jsonl>
 *
 * Download the file from kaikki.org/dictionary/Chinese (Wiktionary, CC BY-SA 4.0); see
 * docs/THIRD_PARTY.md. Then run `npm run update:mandarin-curated-data` to apply it.
 */
import Database from 'better-sqlite3';
import { createReadStream, existsSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

import { MANDARIN_PACK_PATH, MANDARIN_TAIWAN_READINGS_PATH } from './lib/mandarinPack';
import { formatTaiwanReadingsFile } from './lib/taiwanReadingsFile';
import type { TaiwanReadingPair } from './lib/wiktionaryTaiwanReadings';
import { createZhuyinReader, taiwanReadingPairsFromLine } from './lib/wiktionaryTaiwanReadings';

const SYLLABLE_BASE = /^([a-z:]+)[1-5]$/;

/** Every syllable the dictionary's readings use, without tones, and its headwords. */
function readPack(): { syllableBases: Set<string>; headwords: Set<string> } {
  const database = new Database(MANDARIN_PACK_PATH, { readonly: true });
  const rows = database
    .prepare<[], { headword: string; reading: string; variant_reading: string }>(
      'SELECT headword, reading, variant_reading FROM entries',
    )
    .all();
  database.close();
  const syllableBases = new Set<string>();
  for (const row of rows) {
    for (const syllable of `${row.reading} ${row.variant_reading}`.toLowerCase().split(' ')) {
      const base = SYLLABLE_BASE.exec(syllable)?.[1];
      if (base) syllableBases.add(base);
    }
  }
  return { syllableBases, headwords: new Set(rows.map((row) => row.headword)) };
}

async function main(): Promise<void> {
  const sourcePath = process.argv[2];
  if (!sourcePath || !existsSync(sourcePath)) {
    console.error(
      'Usage: npm run extract:taiwan-readings -- <kaikki.org-dictionary-Chinese.jsonl>',
    );
    process.exit(1);
  }
  const { syllableBases, headwords } = readPack();
  const zhuyinToPinyin = createZhuyinReader(syllableBases);
  const pairsByKey = new Map<string, TaiwanReadingPair>();
  const lines = createInterface({
    input: createReadStream(sourcePath, 'utf8'),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    for (const pair of taiwanReadingPairsFromLine(line, zhuyinToPinyin)) {
      if (!headwords.has(pair.headword)) continue;
      pairsByKey.set(`${pair.headword}\t${pair.mainlandReading}`, pair);
    }
  }
  const pairs = [...pairsByKey.values()].sort(
    (first, second) =>
      first.headword.localeCompare(second.headword) ||
      first.mainlandReading.localeCompare(second.mainlandReading),
  );
  writeFileSync(MANDARIN_TAIWAN_READINGS_PATH, formatTaiwanReadingsFile(pairs));
  console.log(`Wrote ${pairs.length} Taiwan readings to ${MANDARIN_TAIWAN_READINGS_PATH}.`);
}

void main();
