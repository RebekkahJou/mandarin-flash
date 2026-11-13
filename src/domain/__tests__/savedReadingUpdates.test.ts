import { planReadingUpdates } from '../savedReadingUpdates';

const PACK = new Map([
  ['休息', [{ reading: 'xiu1 xi2', replacedReading: 'xiu1 xi5' }]],
  [
    '地方',
    [
      { reading: 'di4 fang1', replacedReading: 'di4 fang5' },
      { reading: 'di4 fang1', replacedReading: '' },
    ],
  ],
  [
    '和',
    [
      { reading: 'he2', replacedReading: '' },
      { reading: 'huo4', replacedReading: 'huo2' },
      { reading: 'huo2', replacedReading: 'he2' },
    ],
  ],
  [
    '拜拜',
    [
      { reading: 'bai4 bai5', replacedReading: 'bai2 bai2' },
      { reading: 'bai1 bai1', replacedReading: 'bai2 bai2' },
    ],
  ],
]);

describe('planReadingUpdates', () => {
  it('gives saved words the reading that replaced theirs', () => {
    const saved = [
      { wordId: 1, headword: '休息', reading: 'xiu1 xi5' },
      { wordId: 2, headword: '地方', reading: 'di4 fang5' },
    ];
    expect(planReadingUpdates(saved, PACK)).toEqual([
      { wordId: 1, newReading: 'xiu1 xi2' },
      { wordId: 2, newReading: 'di4 fang1' },
    ]);
  });

  it('leaves readings that are still valid, unknown words and unclear replacements', () => {
    const saved = [
      { wordId: 1, headword: '休息', reading: 'xiu1 xi2' },
      { wordId: 2, headword: '和', reading: 'he2' },
      { wordId: 3, headword: '走', reading: 'zou3' },
      { wordId: 4, headword: '拜拜', reading: 'bai2 bai2' },
    ];
    expect(planReadingUpdates(saved, PACK)).toEqual([]);
  });
});
