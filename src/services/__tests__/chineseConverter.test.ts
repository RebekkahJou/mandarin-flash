import { containsChineseCharacters, toTaiwanTraditional } from '../chineseConverter';

describe('toTaiwanTraditional', () => {
  it('converts Simplified to Taiwan Traditional, including Taiwan phrasing', () => {
    expect(toTaiwanTraditional('软件')).toBe('軟體');
    expect(toTaiwanTraditional('出租车')).toBe('計程車');
    expect(toTaiwanTraditional('头发')).toBe('頭髮');
  });

  it('leaves Traditional input unchanged and trims whitespace', () => {
    expect(toTaiwanTraditional(' 學習 ')).toBe('學習');
  });
});

describe('containsChineseCharacters', () => {
  it('detects Han characters', () => {
    expect(containsChineseCharacters('hello 你')).toBe(true);
    expect(containsChineseCharacters('hello')).toBe(false);
  });
});
