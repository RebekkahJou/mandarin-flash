import { PhoneticDisplay } from '../data/repositories/settingsRepository';
import { toToneMarkedPinyin, toZhuyin } from './pinyin';

const INLINE_READING_SEPARATOR = '  ';
const STACKED_READING_SEPARATOR = '\n';

/**
 * A stored reading as pinyin, zhuyin or both, following a profile's setting. With both, isStacked
 * puts zhuyin on the line below pinyin. Zhuyin is derived, never stored.
 */
export function phoneticText(
  numberedPinyin: string,
  phoneticDisplay: PhoneticDisplay,
  isStacked = false,
): string {
  const pinyin = toToneMarkedPinyin(numberedPinyin);
  const zhuyin = toZhuyin(numberedPinyin);
  const separator = isStacked ? STACKED_READING_SEPARATOR : INLINE_READING_SEPARATOR;
  return {
    [PhoneticDisplay.Pinyin]: pinyin,
    [PhoneticDisplay.Zhuyin]: zhuyin,
    [PhoneticDisplay.Both]: `${pinyin}${separator}${zhuyin}`,
  }[phoneticDisplay];
}
