/**
 * @jest-environment node
 */
import { DICTIONARY_SCHEMA_SQL } from '../../data/dictionarySchema';
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { PartOfSpeech } from '../../domain/partOfSpeech';
import { createDictionaryLookup, partsOfSpeechOf } from '../dictionaryLookup';

async function createLookup() {
  const database = createInMemoryDatabase();
  await database.exec(DICTIONARY_SCHEMA_SQL);
  const insertEntry =
    'INSERT INTO entries (traditional, simplified, pinyin, glosses, rank) VALUES (?, ?, ?, ?, ?)';
  await database.run(insertEntry, ['行', '', 'hang2', '[["row; line",1]]', -1]);
  await database.run(insertEntry, ['行', '', 'xing2', '[["to walk",2],["capable",4]]', -2]);
  await database.run(insertEntry, ['軟體', '软体', 'ruan3 ti3', '[["(Tw) software",1]]', -1]);
  await database.run('INSERT INTO sentences (traditional, english) VALUES (?, ?)', [
    '我想走路。',
    'I want to walk.',
  ]);
  await database.run('INSERT INTO sentences (traditional, english) VALUES (?, ?)', ['走！', 'Go!']);
  return createDictionaryLookup(database);
}

describe('dictionaryLookup', () => {
  it('returns readings most common first, with parts of speech decoded', async () => {
    const lookup = await createLookup();
    const entries = await lookup.lookUp('行');
    expect(entries.map((entry) => entry.pinyin)).toEqual(['xing2', 'hang2']);
    expect(entries[0].definitionCandidates[1]).toEqual({
      text: 'capable',
      partsOfSpeech: [PartOfSpeech.Adjective],
    });
    expect(partsOfSpeechOf(entries).sort()).toEqual(['adjective', 'noun', 'verb']);
  });

  it('converts Simplified input before looking it up', async () => {
    const lookup = await createLookup();
    const [entry] = await lookup.lookUp('软件');
    expect(entry).toMatchObject({ traditional: '軟體', simplified: '软体' });
  });

  it('finds the shortest example sentences first', async () => {
    const lookup = await createLookup();
    const sentences = await lookup.findExampleSentences('走');
    expect(sentences.map((sentence) => sentence.english)).toEqual(['Go!', 'I want to walk.']);
  });
});
