/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';

import { PACK_SCHEMA_SQL } from '../../src/data/packSchema';
import {
  findWordSetReadingNotes,
  parseWordSetEntriesFile,
  parseWordSetsFile,
  writeWordSets,
} from '../lib/wordSetsFile';

const SETS_HEADER = 'set_id\ttopic\ttitle';
const ENTRIES_HEADER = 'set_id\theadword\treading\tword_type\tmeanings\tlanguages\tnote';
const SETS = parseWordSetsFile(`${SETS_HEADER}\ndoctor\thealth\tGoing to the doctor\n`);

function entriesFile(...lines: string[]): string {
  return [ENTRIES_HEADER, ...lines].join('\n');
}

describe('parseWordSetsFile', () => {
  it('reads set ids, topics and titles', () => {
    expect(SETS).toEqual([{ setId: 'doctor', topic: 'health', title: 'Going to the doctor' }]);
  });

  it('rejects a bad id, an unknown topic and a repeated set', () => {
    expect(() => parseWordSetsFile(`${SETS_HEADER}\nDoctor!\thealth\tX`)).toThrow('Line 2');
    expect(() => parseWordSetsFile(`${SETS_HEADER}\ndoctor\tfood\tX`)).toThrow('topic');
    expect(() => parseWordSetsFile(`${SETS_HEADER}\ndoctor\thealth\tX\ndoctor\thealth\tY`)).toThrow(
      'repeats',
    );
  });
});

describe('parseWordSetEntriesFile', () => {
  it('splits meanings, reads languages and numbers positions per set', () => {
    const entries = parseWordSetEntriesFile(
      entriesFile(
        'doctor\t醫生\tyi1 sheng1\tnoun\tdoctor\t\t',
        'doctor\t健保卡\tjian4 bao3 ka3\tnoun\tinsurance card; NHI card\tzh-Hant\tTaiwan only',
      ),
      SETS,
    );
    expect(entries[1]).toEqual({
      setId: 'doctor',
      position: 2,
      headword: '健保卡',
      reading: 'jian4 bao3 ka3',
      wordType: 'noun',
      meanings: ['insurance card', 'NHI card'],
      languages: ['zh-Hant'],
    });
    expect(entries[0].languages).toEqual([]);
  });

  it('accepts a capital letter standing for itself in the reading', () => {
    const [entry] = parseWordSetEntriesFile(
      entriesFile('doctor\t照X光\tzhao4 X guang1\tverb\tto get an X-ray\t\t'),
      SETS,
    );
    expect(entry.reading).toBe('zhao4 X guang1');
  });

  it('rejects unknown sets, word types, languages and bad readings', () => {
    expect(() =>
      parseWordSetEntriesFile(entriesFile('teeth\t牙\tya2\tnoun\ttooth\t\t'), SETS),
    ).toThrow('unknown set');
    expect(() =>
      parseWordSetEntriesFile(entriesFile('doctor\t牙\tya2\tgerund\ttooth\t\t'), SETS),
    ).toThrow('gerund');
    expect(() =>
      parseWordSetEntriesFile(entriesFile('doctor\t牙\tya2\tnoun\ttooth\tfr\t'), SETS),
    ).toThrow('language');
    expect(() =>
      parseWordSetEntriesFile(entriesFile('doctor\t牙\tyá\tnoun\ttooth\t\t'), SETS),
    ).toThrow('numbered reading');
  });

  it('rejects a word listed twice in one set', () => {
    const line = 'doctor\t牙\tya2\tnoun\ttooth\t\t';
    expect(() => parseWordSetEntriesFile(entriesFile(line, line), SETS)).toThrow('repeats');
  });
});

describe('writing word sets into a pack', () => {
  function createPack(): Database.Database {
    const database = new Database(':memory:');
    database.exec(PACK_SCHEMA_SQL);
    database
      .prepare(
        `INSERT INTO entries (headword, variant, reading, variant_reading, glosses, rank)
         VALUES (?, ?, ?, ?, '[]', 0)`,
      )
      .run('垃圾', '', 'le4 se4', 'la1 ji1');
    return database;
  }

  it('takes variants from the dictionary, else converts the headword', () => {
    const database = createPack();
    const entries = parseWordSetEntriesFile(
      entriesFile(
        'doctor\t垃圾\tle4 se4\tnoun\ttrash\t\t',
        'doctor\t醫保卡\tyi1 bao3 ka3\tnoun\tmedical insurance card\tzh-Hans\t',
      ),
      SETS,
    );
    writeWordSets(database, SETS, entries);
    expect(
      database
        .prepare(
          'SELECT headword, variant, variant_reading, meanings, languages FROM word_set_entries ORDER BY position',
        )
        .all(),
    ).toEqual([
      {
        headword: '垃圾',
        variant: '',
        variant_reading: 'la1 ji1',
        meanings: '["trash"]',
        languages: '',
      },
      {
        headword: '醫保卡',
        variant: '医保卡',
        variant_reading: '',
        meanings: '["medical insurance card"]',
        languages: 'zh-Hans',
      },
    ]);
    expect(database.prepare('SELECT set_id, position FROM word_sets').all()).toEqual([
      { set_id: 'doctor', position: 1 },
    ]);
  });

  it('creates the tables in a pack built before schema 3', () => {
    const database = createPack();
    database.exec('DROP TABLE word_sets; DROP TABLE word_set_entries');
    writeWordSets(database, SETS, []);
    expect(database.prepare('SELECT COUNT(*) AS count FROM word_sets').get()).toEqual({ count: 1 });
  });

  it('notes a headword the dictionary reads differently', () => {
    const database = createPack();
    const entries = parseWordSetEntriesFile(
      entriesFile('doctor\t垃圾\tla1 ji1\tnoun\ttrash\t\t', 'doctor\t牙\tya2\tnoun\ttooth\t\t'),
      SETS,
    );
    expect(findWordSetReadingNotes(database, entries)).toEqual([
      '垃圾 la1 ji1: the dictionary has le4 se4.',
    ]);
  });
});
