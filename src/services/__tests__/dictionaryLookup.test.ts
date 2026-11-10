/**
 * @jest-environment node
 */
import { createInMemoryDatabase } from '../../data/testing/nodeSqlDatabase';
import { INSERT_PACK_ENTRY_SQL, writeTestPack } from '../../data/testing/testPack';
import type { SqlDatabase } from '../../data/sqlDatabase';
import { PartOfSpeech } from '../../domain/partOfSpeech';
import type { DictionaryForm } from '../dictionaryLookup';
import { createDictionaryLookup, partsOfSpeechOf } from '../dictionaryLookup';

const TRADITIONAL_TAIWAN: DictionaryForm = {
  readsVariants: false,
  convertSentence: (text) => text,
};

const SIMPLIFIED_MAINLAND: DictionaryForm = {
  readsVariants: true,
  // Stands in for the real Traditional → Simplified converter.
  convertSentence: (text) => text.replace('們', '们'),
};

const RELIABLE = [PartOfSpeech.Noun, PartOfSpeech.Verb, PartOfSpeech.Adjective];

async function createLookup(form: DictionaryForm) {
  const database = createInMemoryDatabase();
  await writeTestPack(database);
  const insertEntry = INSERT_PACK_ENTRY_SQL;
  await database.run(insertEntry, ['行', '', 'hang2', '', '[["row; line",1]]', -1]);
  await database.run(insertEntry, ['行', '', 'xing2', '', '[["to walk",2],["capable",4]]', -2]);
  await database.run(insertEntry, ['軟體', '软体', 'ruan3 ti3', '', '[["(Tw) software",1]]', -1]);
  await database.run(insertEntry, ['軟件', '软件', 'ruan3 jian4', '', '[["software",1]]', -2]);
  await database.run(insertEntry, ['垃圾', '', 'le4 se4', 'la1 ji1', '[["trash",1]]', -1]);
  await database.run(insertEntry, ['髮', '发', 'fa3', '', '[["hair",1]]', -1]);
  await database.run(insertEntry, ['發', '发', 'fa1', '', '[["to send out",2]]', -3]);
  const insertSentence = 'INSERT INTO sentences (text, english) VALUES (?, ?)';
  await database.run(insertSentence, ['我們想走路。', 'We want to walk.']);
  await database.run(insertSentence, ['走！', 'Go!']);
  await database.run(insertSentence, ['我們用軟件。', 'We use software.']);
  await database.run(insertEntry, ['壞', '坏', 'huai4', '', '{not json', -1]);
  return createDictionaryLookup(database, form, RELIABLE);
}

describe('dictionaryLookup in Traditional with Taiwan readings', () => {
  it('returns readings most common first, with parts of speech decoded', async () => {
    const lookup = await createLookup(TRADITIONAL_TAIWAN);
    const entries = await lookup.lookUp('行');
    expect(entries.map((entry) => entry.reading)).toEqual(['xing2', 'hang2']);
    expect(entries[0].definitionCandidates[1]).toEqual({
      text: 'capable',
      partsOfSpeech: [PartOfSpeech.Adjective],
    });
    expect(partsOfSpeechOf(entries).sort()).toEqual(['adjective', 'noun', 'verb']);
  });

  it('shows the Simplified form as the variant and the Taiwan reading', async () => {
    const lookup = await createLookup(TRADITIONAL_TAIWAN);
    expect(await lookup.lookUp('軟體')).toMatchObject([{ headword: '軟體', variant: '软体' }]);
    expect(await lookup.lookUp('垃圾')).toMatchObject([{ headword: '垃圾', reading: 'le4 se4' }]);
  });

  it('finds the shortest example sentences first', async () => {
    const lookup = await createLookup(TRADITIONAL_TAIWAN);
    const sentences = await lookup.findExampleSentences({ headword: '走' });
    expect(sentences.map((sentence) => sentence.english)).toEqual(['Go!', 'We want to walk.']);
  });
});

describe('dictionaryLookup in Simplified with mainland readings', () => {
  it('finds words by their Simplified form, with the Traditional form as the variant', async () => {
    const lookup = await createLookup(SIMPLIFIED_MAINLAND);
    expect(await lookup.lookUp('软件')).toMatchObject([
      { headword: '软件', variant: '軟件', reading: 'ruan3 jian4' },
    ]);
  });

  it('returns every Traditional word that shares a Simplified form', async () => {
    const lookup = await createLookup(SIMPLIFIED_MAINLAND);
    const entries = await lookup.lookUp('发');
    expect(entries.map((entry) => entry.variant)).toEqual(['發', '髮']);
  });

  it('finds words written the same both ways, with the mainland reading', async () => {
    const lookup = await createLookup(SIMPLIFIED_MAINLAND);
    expect(await lookup.lookUp('垃圾')).toEqual([
      expect.objectContaining({ headword: '垃圾', variant: undefined, reading: 'la1 ji1' }),
    ]);
    expect(await lookup.lookUp('行')).toHaveLength(2);
  });

  it('searches sentences by the Traditional form and shows them in Simplified', async () => {
    const lookup = await createLookup(SIMPLIFIED_MAINLAND);
    const sentences = await lookup.findExampleSentences({ headword: '软件', variant: '軟件' });
    expect(sentences).toEqual([{ text: '我们用軟件。', english: 'We use software.' }]);
  });
});

describe('dictionaryLookup with damaged data', () => {
  it('drops meanings it cannot read instead of failing', async () => {
    const lookup = await createLookup(TRADITIONAL_TAIWAN);
    expect(await lookup.lookUp('壞')).toMatchObject([{ headword: '壞', definitionCandidates: [] }]);
  });

  it('passes on the word types the pack tags reliably', async () => {
    const lookup = await createLookup(TRADITIONAL_TAIWAN);
    expect(lookup.reliablePartsOfSpeech).toEqual(RELIABLE);
  });
});

describe('dictionaryLookup starter words', () => {
  async function insertStarterWords(database: SqlDatabase) {
    const insertStarter =
      'INSERT INTO starter_words (set_number, position, headword, reading, part_of_speech) VALUES (?, ?, ?, ?, ?)';
    await database.run(insertStarter, [1, 2, '垃圾', 'le4 se4', 'noun']);
    await database.run(insertStarter, [1, 1, '行', 'xing2', 'verb']);
    await database.run(insertStarter, [1, 3, '行', 'missing9', 'verb']);
    await database.run(insertStarter, [1, 4, '軟件', 'ruan3 jian4', 'gerund']);
    await database.run(insertStarter, [2, 1, '軟件', 'ruan3 jian4', 'phrase']);
  }

  async function lookupWithStarterWords(form: DictionaryForm) {
    const database = createInMemoryDatabase();
    await writeTestPack(database);
    await database.run(INSERT_PACK_ENTRY_SQL, ['行', '', 'xing2', '', '[["to walk",2]]', -2]);
    await database.run(INSERT_PACK_ENTRY_SQL, [
      '垃圾',
      '',
      'le4 se4',
      'la1 ji1',
      '[["trash",1]]',
      -1,
    ]);
    await database.run(INSERT_PACK_ENTRY_SQL, [
      '軟件',
      '软件',
      'ruan3 jian4',
      '',
      '[["software",1]]',
      -2,
    ]);
    await insertStarterWords(database);
    return createDictionaryLookup(database, form, RELIABLE);
  }

  it('counts the words in each set', async () => {
    const lookup = await lookupWithStarterWords(TRADITIONAL_TAIWAN);
    expect(await lookup.starterSetSizes()).toEqual(
      new Map([
        [1, 4],
        [2, 1],
      ]),
    );
  });

  it('returns a set in teaching order, skipping unknown words and word types', async () => {
    const lookup = await lookupWithStarterWords(TRADITIONAL_TAIWAN);
    const words = await lookup.starterWords(1);
    expect(words.map((word) => [word.entry.headword, word.wordType])).toEqual([
      ['行', 'verb'],
      ['垃圾', 'noun'],
    ]);
  });

  it('reads starter words through the variants for Simplified', async () => {
    const lookup = await lookupWithStarterWords(SIMPLIFIED_MAINLAND);
    const [rubbish] = (await lookup.starterWords(1)).slice(1);
    expect(rubbish.entry).toMatchObject({ headword: '垃圾', reading: 'la1 ji1' });
    const [software] = await lookup.starterWords(2);
    expect(software.entry).toMatchObject({ headword: '软件', variant: '軟件' });
  });

  it('is empty for a pack without starter words', async () => {
    const lookup = await createLookup(TRADITIONAL_TAIWAN);
    expect(await lookup.starterSetSizes()).toEqual(new Map());
  });
});

describe('dictionaryLookup components', () => {
  async function lookupWithComponents(form: DictionaryForm) {
    const database = createInMemoryDatabase();
    await writeTestPack(database);
    const insert =
      'INSERT INTO components (position, component, variant, name, reading, meaning) VALUES (?, ?, ?, ?, ?, ?)';
    await database.run(insert, [2, '言', '讠', '言字旁', 'yan2 zi4 pang2', 'speech']);
    await database.run(insert, [1, '氵', '', '三點水', 'san1 dian3 shui3', 'water']);
    return createDictionaryLookup(database, form, RELIABLE);
  }

  it('lists components in teaching order with their Simplified form as the variant', async () => {
    const lookup = await lookupWithComponents(TRADITIONAL_TAIWAN);
    expect(await lookup.components()).toEqual([
      {
        component: '氵',
        variant: undefined,
        name: '三點水',
        reading: 'san1 dian3 shui3',
        meaning: 'water',
      },
      {
        component: '言',
        variant: '讠',
        name: '言字旁',
        reading: 'yan2 zi4 pang2',
        meaning: 'speech',
      },
    ]);
  });

  it('reads components through their variants for Simplified', async () => {
    const lookup = await lookupWithComponents({
      readsVariants: true,
      convertSentence: (text) => text.replace('點', '点'),
    });
    const [water, speech] = await lookup.components();
    expect(water.name).toBe('三点水');
    expect(speech).toMatchObject({ component: '讠', variant: '言' });
  });

  it('has no components in a schema 1 pack', async () => {
    const database = createInMemoryDatabase();
    await writeTestPack(database);
    await database.exec('DROP TABLE components');
    const lookup = createDictionaryLookup(database, TRADITIONAL_TAIWAN, RELIABLE);
    expect(await lookup.components()).toEqual([]);
  });
});
