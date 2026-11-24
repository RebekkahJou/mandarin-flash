import { PhoneticDisplay } from '../../data/repositories/settingsRepository';
import { phoneticText } from '../phoneticText';

describe('phoneticText', () => {
  it('shows pinyin, zhuyin or both, stacked on request', () => {
    expect(phoneticText('ni3 hao3', PhoneticDisplay.Pinyin)).toBe('nǐ hǎo');
    expect(phoneticText('ni3 hao3', PhoneticDisplay.Zhuyin)).toBe('ㄋㄧˇ ㄏㄠˇ');
    expect(phoneticText('ni3 hao3', PhoneticDisplay.Both)).toBe('nǐ hǎo  ㄋㄧˇ ㄏㄠˇ');
    expect(phoneticText('ni3 hao3', PhoneticDisplay.Both, true)).toBe('nǐ hǎo\nㄋㄧˇ ㄏㄠˇ');
  });
});
