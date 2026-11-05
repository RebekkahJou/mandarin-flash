import { GeneralWordList } from '../../domain/generalWordList';
import { PartOfSpeech } from '../../domain/partOfSpeech';
import { PartOfSpeechWordList } from '../../domain/partOfSpeechWordList';
import { makeWord } from '../../domain/__tests__/testWords';
import { buildWordListCsv, csvFileNameForList, escapeFormulaCell } from '../csvExport';
import {
  CsvTooLargeError,
  MAX_CSV_BYTES,
  describeImportPlans,
  parseWordCsv,
  planCsvImport,
} from '../csvImport';
import type { DictionaryEntry } from '../dictionaryLookup';
import { mandarinTraditionalModule as mandarin } from '../languages/mandarinTraditionalModule';

const generalList = new GeneralWordList({ id: 1, profileId: 1, name: 'General Vocabulary' });

const dictionary: Record<string, DictionaryEntry[]> = {
  軟體: [
    {
      headword: '軟體',
      variant: '软体',
      reading: 'ruan3 ti3',
      definitionCandidates: [{ text: '(Tw) software', partsOfSpeech: ['noun'] }],
    },
  ],
};
const lookUp = async (headword: string) => dictionary[headword] ?? [];

describe('parseWordCsv', () => {
  it('reads columns by header name in any order', () => {
    const parsed = parseWordCsv('pinyin,character,meaning\nnǐ hǎo,你好,hello', mandarin);
    expect(parsed.rows).toEqual([
      { rowNumber: 2, headword: '你好', meanings: ['hello'], reading: 'ni3 hao3' },
    ]);
  });

  it('uses the export order (character, meaning, pinyin) when there is no header', () => {
    const parsed = parseWordCsv('走,to walk / to go,zou3', mandarin);
    expect(parsed.rows[0]).toMatchObject({ meanings: ['to walk', 'to go'], reading: 'zou3' });
  });

  it('reports rows without Chinese characters as invalid', () => {
    const parsed = parseWordCsv('character,meaning\nhello,world\n好,good', mandarin);
    expect(parsed.invalidRowNumbers).toEqual([2]);
    expect(parsed.rows).toHaveLength(1);
  });

  it('rejects files over the size limit', () => {
    expect(() => parseWordCsv('好', mandarin, MAX_CSV_BYTES + 1)).toThrow(CsvTooLargeError);
  });
});

describe('planCsvImport', () => {
  it('converts to Traditional, fills missing meanings and skips duplicates', async () => {
    const parsed = parseWordCsv('character\n软件\n學生\n軟體', mandarin);
    const plan = await planCsvImport(parsed, generalList, new Set(['學生']), lookUp);
    expect(plan.wordsToAdd).toEqual([
      {
        headword: '軟體',
        variant: '软体',
        reading: 'ruan3 ti3',
        definitions: ['(Tw) software'],
      },
    ]);
    expect(plan.skippedDuplicates).toEqual(['學生', '軟體']);
  });

  it('reports words with no meaning in the file or the dictionary', async () => {
    const plan = await planCsvImport(
      parseWordCsv('character\n㐀', mandarin),
      generalList,
      new Set(),
      lookUp,
    );
    expect(plan.unknownCharacters).toEqual(['㐀']);
    expect(plan.wordsToAdd).toHaveLength(0);
  });
});

describe('describeImportPlans', () => {
  it('summarizes each list once and the shared problems once', async () => {
    const parsed = parseWordCsv('character\nhello\n軟體\n學生\n㐀', mandarin);
    const generalPlan = await planCsvImport(parsed, generalList, new Set(), lookUp);
    const focusPlan = await planCsvImport(parsed, generalList, new Set(['軟體']), lookUp);
    expect(
      describeImportPlans([
        { listName: 'General Vocabulary', plan: generalPlan },
        { listName: 'Focus Vocabulary', plan: focusPlan },
      ]).split('\n'),
    ).toEqual([
      'General Vocabulary: 1 word to add.',
      'Focus Vocabulary: 0 words to add, 1 already there (skipped).',
      '2 not found and had no meaning: 學生, 㐀',
      'Rows without Chinese characters (skipped): 2',
    ]);
  });
});

describe('part-of-speech mismatches', () => {
  const verbs = new PartOfSpeechWordList({
    id: 3,
    profileId: 1,
    name: 'Verbs',
    partOfSpeech: PartOfSpeech.Verb,
  });

  it('flags words with no meaning of the list type, even when the file has every column', async () => {
    const parsed = parseWordCsv(
      'character,meaning,pinyin\n軟體,software,ruan3 ti3\n㐀,odd,qiu1',
      mandarin,
    );
    const plan = await planCsvImport(parsed, verbs, new Set(), lookUp);
    expect(plan.wordsToAdd.map((draft) => draft.headword)).toEqual(['軟體', '㐀']);
    // 㐀 is not in the dictionary, so it can't be judged and isn't flagged.
    expect(plan.partOfSpeechMismatches).toEqual(['軟體']);
    expect(describeImportPlans([{ listName: 'Verbs', plan }]).split('\n')).toEqual([
      'Verbs: 2 words to add.',
      '  Not a usual fit for Verbs: 軟體',
    ]);
  });

  it('never flags words for general lists', async () => {
    const plan = await planCsvImport(
      parseWordCsv('軟體', mandarin),
      generalList,
      new Set(),
      lookUp,
    );
    expect(plan.partOfSpeechMismatches).toEqual([]);
  });
});

describe('buildWordListCsv', () => {
  it('exports character, per-list meaning and tone-marked pinyin', () => {
    const word = makeWord(1, { headword: '你好', reading: 'ni3 hao3', definitions: ['hi'] });
    const csv = buildWordListCsv(
      [{ entryId: 1, word, definitionsOverride: ['hello', 'hi'] }],
      mandarin,
    );
    expect(csv.split('\r\n')).toEqual(['character,meaning,pinyin', '你好,hello / hi,nǐ hǎo']);
  });

  it('round-trips through import, including escaped formula cells', () => {
    const word = makeWord(1, { headword: '加', reading: 'jia1', definitions: ['+1'] });
    const parsed = parseWordCsv(buildWordListCsv([{ entryId: 1, word }], mandarin), mandarin);
    expect(parsed.rows[0]).toMatchObject({ headword: '加', meanings: ['+1'], reading: 'jia1' });
  });
});

describe('escapeFormulaCell', () => {
  it('neutralizes cells that spreadsheets would run as formulas', () => {
    expect(escapeFormulaCell('=HYPERLINK("x")')).toBe('\'=HYPERLINK("x")');
    expect(escapeFormulaCell('hello')).toBe('hello');
  });
});

describe('csvFileNameForList', () => {
  it('keeps letters and replaces unsafe characters', () => {
    expect(csvFileNameForList('My Verbs/../x')).toBe('My-Verbs-x.csv');
    expect(csvFileNameForList('動詞')).toBe('動詞.csv');
  });
});
