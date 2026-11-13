/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';

import { PACK_SCHEMA_SQL } from '../../src/data/packSchema';
import {
  findStarterWordProblems,
  parseStarterWordsFile,
  writeStarterWords,
} from '../lib/starterWordsFile';

const HEADER = 'set\theadword\treading\tword_type';

describe('parseStarterWordsFile', () => {
  it('numbers positions within each set in file order', () => {
    const words = parseStarterWordsFile(
      `${HEADER}\n1\t我\two3\tpronoun\n1\t你好\tni3 hao3\tphrase\n2\t大\tda4\tadjective\n`,
    );
    expect(words.map((word) => [word.setNumber, word.position, word.headword])).toEqual([
      [1, 1, '我'],
      [1, 2, '你好'],
      [2, 1, '大'],
    ]);
  });

  it('rejects a missing header, a bad set number and an unknown word type', () => {
    expect(() => parseStarterWordsFile('1\t我\two3\tpronoun')).toThrow('first line');
    expect(() => parseStarterWordsFile(`${HEADER}\nx\t我\two3\tpronoun`)).toThrow('Line 2');
    expect(() => parseStarterWordsFile(`${HEADER}\n1\t我\two3\tgerund`)).toThrow('gerund');
  });
});

describe('starter words in a pack', () => {
  function createPack() {
    const database = new Database(':memory:');
    database.exec(PACK_SCHEMA_SQL);
    database
      .prepare(
        `INSERT INTO entries (headword, variant, reading, variant_reading, glosses, rank)
         VALUES ('我', '', 'wo3', '', '[["I",16]]', -1)`,
      )
      .run();
    return database;
  }

  it('reports words missing from the dictionary and repeated words', () => {
    const words = parseStarterWordsFile(
      `${HEADER}\n1\t我\two3\tpronoun\n1\t我\two3\tpronoun\n1\t好\thao3\tadjective`,
    );
    expect(findStarterWordProblems(createPack(), words)).toEqual([
      '我 wo3 is listed twice.',
      '好 hao3 is not in the dictionary.',
    ]);
  });

  it('replaces the starter words', () => {
    const database = createPack();
    const words = parseStarterWordsFile(`${HEADER}\n1\t我\two3\tpronoun`);
    writeStarterWords(database, words);
    writeStarterWords(database, words);
    expect(database.prepare('SELECT headword, part_of_speech FROM starter_words').all()).toEqual([
      { headword: '我', part_of_speech: 'pronoun' },
    ]);
  });
});
