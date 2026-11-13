/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';

import { PACK_SCHEMA_SQL } from '../../src/data/packSchema';
import {
  applyTaiwanReadings,
  formatTaiwanReadingsFile,
  indexTaiwanReadings,
  parseTaiwanReadingsFile,
  withTaiwanReadings,
} from '../lib/taiwanReadingsFile';

const PAIRS = [
  { headword: '舒服', mainlandReading: 'shu1 fu5', taiwanReading: 'shu1 fu2' },
  { headword: '地方', mainlandReading: 'di4 fang5', taiwanReading: 'di4 fang1' },
  { headword: '垃圾', mainlandReading: 'la1 ji1', taiwanReading: 'le4 se4' },
  { headword: '起來', mainlandReading: 'qi3 lai5', taiwanReading: 'qi3 lai2' },
];
const INDEX = indexTaiwanReadings(PAIRS);

describe('the Taiwan readings file', () => {
  it('round-trips through its text form', () => {
    expect(parseTaiwanReadingsFile(formatTaiwanReadingsFile(PAIRS))).toEqual(PAIRS);
  });

  it('rejects a missing header or a reading that is not numbered pinyin', () => {
    expect(() => parseTaiwanReadingsFile('舒服\tshu1 fu5\tshu1 fu2')).toThrow('first line');
    expect(() =>
      parseTaiwanReadingsFile('headword\tmainland_reading\ttaiwan_reading\n舒服\tshū fu\tshu1 fu2'),
    ).toThrow('Line 2');
  });
});

describe('withTaiwanReadings', () => {
  it('swaps a listed word, or listed words inside a longer one', () => {
    expect(withTaiwanReadings('舒服', 'shu1 fu5', INDEX)).toBe('shu1 fu2');
    expect(withTaiwanReadings('我不舒服', 'wo3 bu4 shu1 fu5', INDEX)).toBe('wo3 bu4 shu1 fu2');
  });

  it('leaves directional complements after a verb neutral', () => {
    expect(withTaiwanReadings('起來', 'qi3 lai5', INDEX)).toBe('qi3 lai2');
    expect(withTaiwanReadings('站起來', 'zhan4 qi3 lai5', INDEX)).toBe('zhan4 qi3 lai5');
  });

  it('keeps readings it cannot line up with the characters', () => {
    expect(withTaiwanReadings('舒服嗎', 'shu1 fu5', INDEX)).toBe('shu1 fu5');
    expect(withTaiwanReadings('舒服', 'shu1 fu2', INDEX)).toBe('shu1 fu2');
  });
});

describe('applyTaiwanReadings', () => {
  function createPack(): Database.Database {
    const database = new Database(':memory:');
    database.exec(PACK_SCHEMA_SQL);
    const insert = database.prepare(
      `INSERT INTO entries (headword, variant, reading, variant_reading, glosses, rank)
       VALUES (?, '', ?, ?, '[]', 0)`,
    );
    insert.run('地方', 'di4 fang5', '');
    insert.run('地方', 'di4 fang1', '');
    insert.run('垃圾', 'le4 se4', 'la1 ji1');
    insert.run('不舒服', 'bu4 shu1 fu5', '');
    return database;
  }

  function readings(database: Database.Database) {
    return database.prepare('SELECT headword, reading, variant_reading FROM entries').all();
  }

  it('uses Taiwan readings and keeps the mainland ones as variant readings', () => {
    const database = createPack();
    expect(applyTaiwanReadings(database, PAIRS)).toBe(2);
    expect(readings(database)).toEqual([
      { headword: '地方', reading: 'di4 fang1', variant_reading: 'di4 fang5' },
      { headword: '地方', reading: 'di4 fang1', variant_reading: '' },
      { headword: '垃圾', reading: 'le4 se4', variant_reading: 'la1 ji1' },
      { headword: '不舒服', reading: 'bu4 shu1 fu2', variant_reading: 'bu4 shu1 fu5' },
    ]);
  });

  it('changes nothing when run again', () => {
    const database = createPack();
    applyTaiwanReadings(database, PAIRS);
    expect(applyTaiwanReadings(database, PAIRS)).toBe(0);
  });
});
