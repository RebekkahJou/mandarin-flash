import {
  isCrossReferenceOnly,
  parseCedictLine,
  spaceSyllables,
  usefulGlosses,
} from '../lib/cedictParser';

describe('parseCedictLine', () => {
  it('parses characters, pinyin and glosses', () => {
    const entry = parseCedictLine('學生 学生 [xue2 sheng5] /student/schoolchild/CL:個|个[ge4]/');
    expect(entry).toEqual({
      traditional: '學生',
      simplified: '学生',
      pinyin: 'xue2 sheng5',
      mainlandPinyin: 'xue2 sheng5',
      glosses: ['student', 'schoolchild'],
      hasClassifier: true,
    });
  });

  it('uses the whole-word Taiwan pronunciation when one is listed', () => {
    const entry = parseCedictLine('下頦 下颏 [xia4 ke1] /chin/Taiwan pr. [xia4hai2]/');
    expect(entry?.pinyin).toBe('xia4 hai2');
    expect(entry?.mainlandPinyin).toBe('xia4 ke1');
    expect(entry?.glosses).toEqual(['chin']);
  });

  it('strips "(bound form)" labels', () => {
    const entry = parseCedictLine('行 行 [xing2] /(bound form) to walk; to go/');
    expect(entry?.glosses).toEqual(['to walk; to go']);
  });

  it('skips comments and malformed lines', () => {
    expect(parseCedictLine('# CC-CEDICT')).toBeNull();
    expect(parseCedictLine('not an entry')).toBeNull();
  });
});

describe('spaceSyllables', () => {
  it('inserts spaces between run-together syllables', () => {
    expect(spaceSyllables('zhong1pei4')).toBe('zhong1 pei4');
  });
});

describe('gloss filtering', () => {
  it('detects cross-reference-only entries', () => {
    const entry = parseCedictLine('於 於 [Yu1] /variant of 于[yu2]/');
    expect(entry && isCrossReferenceOnly(entry)).toBe(true);
  });

  it('puts Taiwan usages first', () => {
    const entry = parseCedictLine(
      '軟體 软体 [ruan3 ti3] /(of an animal) soft-bodied/(Tw) software/',
    );
    expect(entry && usefulGlosses(entry)).toEqual(['(Tw) software', '(of an animal) soft-bodied']);
  });
});
