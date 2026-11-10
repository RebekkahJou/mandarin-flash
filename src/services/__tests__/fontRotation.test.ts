import {
  CHINESE_FONT_ROTATION,
  SYSTEM_CHINESE_FONT,
  cardFontRotation,
  fontForText,
  pickNextCardFont,
} from '../fontRotation';

describe('cardFontRotation', () => {
  it('rotates among the system font and three bundled fonts for Traditional', () => {
    expect(cardFontRotation(true, ['mandarin-NotoSansSC'])).toBe(CHINESE_FONT_ROTATION);
    expect(CHINESE_FONT_ROTATION).toHaveLength(4);
  });

  it("uses the system font and the pack's fonts otherwise", () => {
    expect(cardFontRotation(false, ['mandarin-NotoSansSC'])).toEqual([
      SYSTEM_CHINESE_FONT,
      'mandarin-NotoSansSC',
    ]);
    expect(cardFontRotation(false, [])).toEqual([SYSTEM_CHINESE_FONT]);
  });
});

describe('pickNextCardFont', () => {
  it('never picks the previous font again', () => {
    for (const previousFont of CHINESE_FONT_ROTATION) {
      for (const randomValue of [0, 0.5, 0.9999]) {
        expect(pickNextCardFont(CHINESE_FONT_ROTATION, previousFont, () => randomValue)).not.toBe(
          previousFont,
        );
      }
    }
  });

  it('keeps the only font when there is no other', () => {
    expect(pickNextCardFont([SYSTEM_CHINESE_FONT], SYSTEM_CHINESE_FONT)).toBe(SYSTEM_CHINESE_FONT);
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

  it('trusts pack fonts to cover their language', () => {
    expect(fontForText('mandarin-NotoSansSC', '你㐀', supported)).toBe('mandarin-NotoSansSC');
  });
});
