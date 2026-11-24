import { compareSortKeys } from '../../domain/wordSort';
import {
  pinyinSortKey,
  toNumberedPinyin,
  toToneMarkedPinyin,
  toZhuyin,
  zhuyinSortKey,
} from '../pinyin';

describe('toToneMarkedPinyin', () => {
  it.each([
    ['ni3 hao3', 'nǐ hǎo'],
    ['xie4 xie5', 'xiè xie'],
    ['zhong1 guo2', 'zhōng guó'],
    ['liu2', 'liú'],
    ['gui4', 'guì'],
    ['dou1', 'dōu'],
    ['lu:4', 'lǜ'],
    ['nv3', 'nǚ'],
    ['Bei3 jing1', 'Běi jīng'],
  ])('%s → %s', (numbered, marked) => {
    expect(toToneMarkedPinyin(numbered)).toBe(marked);
  });

  it('keeps unrecognized syllables unchanged', () => {
    expect(toToneMarkedPinyin('A A zhi4')).toBe('A A zhì');
  });
});

describe('toNumberedPinyin', () => {
  it('converts tone marks to numbers', () => {
    expect(toNumberedPinyin('nǐ hǎo')).toBe('ni3 hao3');
    expect(toNumberedPinyin('lǜ')).toBe('lu:4');
  });

  it('treats unmarked syllables as neutral tone and passes numbered input through', () => {
    expect(toNumberedPinyin('xiè xie')).toBe('xie4 xie5');
    expect(toNumberedPinyin('Ni3 hao3')).toBe('ni3 hao3');
  });
});

describe('toZhuyin', () => {
  it.each([
    ['ni3 hao3', 'ㄋㄧˇ ㄏㄠˇ'],
    ['xie4 xie5', 'ㄒㄧㄝˋ ˙ㄒㄧㄝ'],
    ['zhong1 wen2', 'ㄓㄨㄥ ㄨㄣˊ'],
    ['shi4', 'ㄕˋ'],
    ['zi4', 'ㄗˋ'],
    ['ju2', 'ㄐㄩˊ'],
    ['xue2', 'ㄒㄩㄝˊ'],
    ['quan2', 'ㄑㄩㄢˊ'],
    ['yi1', 'ㄧ'],
    ['you3', 'ㄧㄡˇ'],
    ['yong4', 'ㄩㄥˋ'],
    ['yu2', 'ㄩˊ'],
    ['yuan2', 'ㄩㄢˊ'],
    ['wo3', 'ㄨㄛˇ'],
    ['wei4', 'ㄨㄟˋ'],
    ['gui4', 'ㄍㄨㄟˋ'],
    ['lu:4', 'ㄌㄩˋ'],
    ['er4', 'ㄦˋ'],
    ['r5', '˙ㄦ'],
    ['zhuang4', 'ㄓㄨㄤˋ'],
    ['Bei3 jing1', 'ㄅㄟˇ ㄐㄧㄥ'],
  ])('%s → %s', (numbered, zhuyin) => {
    expect(toZhuyin(numbered)).toBe(zhuyin);
  });
});

function sortedBy(keyFor: (reading: string) => readonly (string | number)[], readings: string[]) {
  return [...readings].sort((first, second) => compareSortKeys(keyFor(first), keyFor(second)));
}

describe('pinyinSortKey', () => {
  it('sorts by letters, then tone, syllable by syllable', () => {
    expect(sortedBy(pinyinSortKey, ['ma3', 'ma1', 'mai4', 'ma5', 'ma1 ma5', 'ma2'])).toEqual([
      'ma1',
      'ma1 ma5',
      'ma2',
      'ma3',
      'ma5',
      'mai4',
    ]);
  });

  it('puts ü after u', () => {
    expect(sortedBy(pinyinSortKey, ['lu:4', 'luan4', 'lu4'])).toEqual(['lu4', 'luan4', 'lu:4']);
  });
});

describe('zhuyinSortKey', () => {
  it('sorts by zhuyin symbol order, then tone', () => {
    // ㄅ (b) before ㄆ (p) before ㄇ (m), whatever their pinyin letters.
    expect(sortedBy(zhuyinSortKey, ['ma1', 'pa2', 'ba4', 'ba1'])).toEqual([
      'ba1',
      'ba4',
      'pa2',
      'ma1',
    ]);
  });
});
