import {
  CHINESE_FONT_ROTATION,
  SYSTEM_CHINESE_FONT,
  fontForText,
  pickNextChineseFont,
} from '../fontRotation';

describe('pickNextChineseFont', () => {
  it('rotates among four fonts', () => {
    expect(CHINESE_FONT_ROTATION).toHaveLength(4);
  });

  it('never picks the previous font again', () => {
    for (const previousFont of CHINESE_FONT_ROTATION) {
      for (const randomValue of [0, 0.5, 0.9999]) {
        expect(pickNextChineseFont(previousFont, () => randomValue)).not.toBe(previousFont);
      }
    }
  });
});

describe('fontForText', () => {
  const supported = new Set(['你', '好']);

  it('keeps the chosen font when it has every character', () => {
    expect(fontForText('NotoSerifTC', '你好', supported)).toBe('NotoSerifTC');
  });

  it('falls back to the system font for characters outside the subset', () => {
    expect(fontForText('NotoSerifTC', '你㐀', supported)).toBe(SYSTEM_CHINESE_FONT);
  });

  it('includes common characters in the bundled subset', () => {
    expect(fontForText('LXGWWenKaiTC', '我們學中文')).toBe('LXGWWenKaiTC');
  });
});
