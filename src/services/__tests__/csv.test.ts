import { GeneralWordList } from '../../domain/generalWordList';
import { makeWord } from '../../domain/__tests__/testWords';
import { buildWordListCsv, csvFileNameForList, escapeFormulaCell } from '../csvExport';
import { CsvTooLargeError, MAX_CSV_BYTES, parseWordCsv, planCsvImport } from '../csvImport';
import type { DictionaryEntry } from '../dictionaryLookup';

const generalList = new GeneralWordList({ id: 1, profileId: 1, name: 'General Vocabulary' });

const dictionary: Record<string, DictionaryEntry[]> = {
  軟體: [
    {
      traditional: '軟體',
      simplified: '软体',
      pinyin: 'ruan3 ti3',
      definitionCandidates: [{ text: '(Tw) software', partsOfSpeech: ['noun'] }],
    },
  ],
};
const lookUp = async (traditional: string) => dictionary[traditional] ?? [];

describe('parseWordCsv', () => {
  it('reads columns by header name in any order', () => {
    const parsed = parseWordCsv('pinyin,character,meaning\nnǐ hǎo,你好,hello');
    expect(parsed.rows).toEqual([
      { rowNumber: 2, characters: '你好', meanings: ['hello'], pinyin: 'ni3 hao3' },
    ]);
  });

  it('uses the export order (character, meaning, pinyin) when there is no header', () => {
    const parsed = parseWordCsv('走,to walk / to go,zou3');
    expect(parsed.rows[0]).toMatchObject({ meanings: ['to walk', 'to go'], pinyin: 'zou3' });
  });

  it('reports rows without Chinese characters as invalid', () => {
    const parsed = parseWordCsv('character,meaning\nhello,world\n好,good');
    expect(parsed.invalidRowNumbers).toEqual([2]);
    expect(parsed.rows).toHaveLength(1);
  });

  it('rejects files over the size limit', () => {
    expect(() => parseWordCsv('好', MAX_CSV_BYTES + 1)).toThrow(CsvTooLargeError);
  });
});

describe('planCsvImport', () => {
  it('converts to Traditional, fills missing meanings and skips duplicates', async () => {
    const parsed = parseWordCsv('character\n软件\n學生\n軟體');
    const plan = await planCsvImport(parsed, generalList, new Set(['學生']), lookUp);
    expect(plan.wordsToAdd).toEqual([
      {
        traditional: '軟體',
        simplified: '软体',
        pinyin: 'ruan3 ti3',
        definitions: ['(Tw) software'],
      },
    ]);
    expect(plan.skippedDuplicates).toEqual(['學生', '軟體']);
  });

  it('reports words with no meaning in the file or the dictionary', async () => {
    const plan = await planCsvImport(parseWordCsv('character\n㐀'), generalList, new Set(), lookUp);
    expect(plan.unknownCharacters).toEqual(['㐀']);
    expect(plan.wordsToAdd).toHaveLength(0);
  });
});

describe('buildWordListCsv', () => {
  it('exports character, per-list meaning and tone-marked pinyin', () => {
    const word = makeWord(1, { traditional: '你好', pinyin: 'ni3 hao3', definitions: ['hi'] });
    const csv = buildWordListCsv([{ entryId: 1, word, definitionsOverride: ['hello', 'hi'] }]);
    expect(csv.split('\r\n')).toEqual(['character,meaning,pinyin', '你好,hello / hi,nǐ hǎo']);
  });

  it('round-trips through import, including escaped formula cells', () => {
    const word = makeWord(1, { traditional: '加', pinyin: 'jia1', definitions: ['+1'] });
    const parsed = parseWordCsv(buildWordListCsv([{ entryId: 1, word }]));
    expect(parsed.rows[0]).toMatchObject({ characters: '加', meanings: ['+1'], pinyin: 'jia1' });
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
