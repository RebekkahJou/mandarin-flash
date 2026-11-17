/**
 * @jest-environment node
 */
import { createZhuyinReader, taiwanReadingPairsFromLine } from '../lib/wiktionaryTaiwanReadings';

const zhuyinToPinyin = createZhuyinReader(['xiu', 'xi', 'yi', 'fu', 'hu', 'shi', 'chi', 'ji']);

function sound(zhuyin: string, ...tags: string[]) {
  return { zh_pron: zhuyin, tags: ['Mandarin', 'Standard-Chinese', 'Bopomofo', ...tags] };
}

function line(word: string, sounds: unknown[]): string {
  return JSON.stringify({ word, sounds });
}

describe('createZhuyinReader', () => {
  it('reads Bopomofo syllables as numbered pinyin, including the neutral tone', () => {
    expect(zhuyinToPinyin('ㄒㄧㄡ ㄒㄧˊ')).toBe('xiu1 xi2');
    expect(zhuyinToPinyin('ㄒㄧㄡ ˙ㄒㄧ')).toBe('xiu1 xi5');
  });

  it('gives up on a syllable it does not know', () => {
    expect(zhuyinToPinyin('ㄇㄚˇ')).toBeNull();
  });
});

describe('taiwanReadingPairsFromLine', () => {
  it('pairs a Taiwan reading with the mainland one before it', () => {
    const pairs = taiwanReadingPairsFromLine(
      line('休息', [sound('ㄒㄧㄡ ˙ㄒㄧ', 'Mainland-China'), sound('ㄒㄧㄡ ㄒㄧˊ', 'Taiwan')]),
      zhuyinToPinyin,
    );
    expect(pairs).toEqual([
      { headword: '休息', mainlandReading: 'xiu1 xi5', taiwanReading: 'xiu1 xi2' },
    ]);
  });

  it('treats a mainland reading tagged as a Taiwan variant as the mainland one', () => {
    const pairs = taiwanReadingPairsFromLine(
      line('衣服', [
        sound('ㄧ ˙ㄈㄨ', 'Mainland-China', 'standard', 'Taiwan', 'variant'),
        sound('ㄧ ㄈㄨˊ', 'Taiwan', 'standard'),
      ]),
      zhuyinToPinyin,
    );
    expect(pairs).toEqual([
      { headword: '衣服', mainlandReading: 'yi1 fu5', taiwanReading: 'yi1 fu2' },
    ]);
  });

  it('prefers the shared toned reading over a toneless-final variant', () => {
    const pairs = taiwanReadingPairsFromLine(
      line('護士', [sound('ㄏㄨˋ ㄕˋ'), sound('ㄏㄨˋ ˙ㄕ', 'toneless-final-syllable-variant')]),
      zhuyinToPinyin,
    );
    expect(pairs).toEqual([
      { headword: '護士', mainlandReading: 'hu4 shi5', taiwanReading: 'hu4 shi4' },
    ]);
  });

  it('skips single characters, erhua, identical readings and bad input', () => {
    const characterLine = line('吃', [sound('ㄔ', 'Mainland-China'), sound('ㄐㄧˊ', 'Taiwan')]);
    expect(taiwanReadingPairsFromLine(characterLine, zhuyinToPinyin)).toEqual([]);
    const erhuaLine = line('休息', [
      sound('ㄒㄧㄡ ˙ㄒㄧ', 'Mainland-China'),
      sound('ㄒㄧㄡ ㄒㄧˊ', 'Taiwan', 'erhua-ed'),
    ]);
    expect(taiwanReadingPairsFromLine(erhuaLine, zhuyinToPinyin)).toEqual([]);
    const sameLine = line('休息', [
      sound('ㄒㄧㄡ ㄒㄧˊ', 'Mainland-China'),
      sound('ㄒㄧㄡ ㄒㄧˊ', 'Taiwan'),
    ]);
    expect(taiwanReadingPairsFromLine(sameLine, zhuyinToPinyin)).toEqual([]);
    expect(taiwanReadingPairsFromLine('{not json', zhuyinToPinyin)).toEqual([]);
    expect(taiwanReadingPairsFromLine(line('ABC', []), zhuyinToPinyin)).toEqual([]);
    expect(taiwanReadingPairsFromLine(JSON.stringify({ word: 5 }), zhuyinToPinyin)).toEqual([]);
  });
});
