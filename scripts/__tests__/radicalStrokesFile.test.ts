import {
  formatRadicalStrokesFile,
  parseRadicalStrokesFile,
  parseUnihanRadicalStrokes,
} from '../lib/radicalStrokesFile';

describe('parseUnihanRadicalStrokes', () => {
  it('reads the first kRSUnicode value, ignoring simplified-radical marks and other fields', () => {
    const unihan = [
      '# Unihan_IRGSources.txt',
      'U+4EBA\tkRSUnicode\t9.0',
      "U+8BF4\tkRSUnicode\t149'.7",
      'U+4E9C\tkRSUnicode\t7.4 1.6',
      'U+4E00\tkTotalStrokes\t1',
      'U+5344\tkRSUnicode\t24.-1',
      'U+9999\tkRSUnicode\tnonsense',
    ].join('\n');
    expect(parseUnihanRadicalStrokes(unihan)).toEqual(
      new Map([
        ['人', { radical: 9, remainingStrokes: 0 }],
        ['说', { radical: 149, remainingStrokes: 7 }],
        ['亜', { radical: 7, remainingStrokes: 4 }],
        ['卄', { radical: 24, remainingStrokes: -1 }],
      ]),
    );
  });
});

describe('radical strokes file', () => {
  it('writes characters in code point order and reads them back', () => {
    const positions = new Map([
      ['說', { radical: 149, remainingStrokes: 7 }],
      ['人', { radical: 9, remainingStrokes: 0 }],
    ]);
    const text = formatRadicalStrokesFile(positions);
    expect(text).toBe('character\tradical\tremaining_strokes\n人\t9\t0\n說\t149\t7\n');
    expect(parseRadicalStrokesFile(text)).toEqual(positions);
  });

  it('rejects a line without a single character and whole numbers', () => {
    expect(() =>
      parseRadicalStrokesFile('character\tradical\tremaining_strokes\n人人\t9\t0\n'),
    ).toThrow('Line 2');
  });
});
