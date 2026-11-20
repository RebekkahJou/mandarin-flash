import type { TextStyle } from 'react-native';
import { Text } from 'react-native';

import { PhoneticDisplay } from '../../data/repositories/settingsRepository';
import { toToneMarkedPinyin, toZhuyin } from '../../services/pinyin';
import { useSettings } from '../AppServicesContext';
import { ENGLISH_FONT_FAMILY } from '../theme';

interface PhoneticTextProps {
  numberedPinyin: string;
  style?: TextStyle;
  /** With both readings shown, puts pinyin on one line and zhuyin on the line below. */
  isStacked?: boolean;
}

const INLINE_READING_SEPARATOR = '  ';
const STACKED_READING_SEPARATOR = '\n';

/** Shows pinyin, Zhuyin or both, following the user's setting. Zhuyin is derived, never stored. */
export function PhoneticText({ numberedPinyin, style, isStacked = false }: PhoneticTextProps) {
  const { phoneticDisplay } = useSettings().settings;
  const pinyin = toToneMarkedPinyin(numberedPinyin);
  const zhuyin = toZhuyin(numberedPinyin);
  const separator = isStacked ? STACKED_READING_SEPARATOR : INLINE_READING_SEPARATOR;
  const text = {
    [PhoneticDisplay.Pinyin]: pinyin,
    [PhoneticDisplay.Zhuyin]: zhuyin,
    [PhoneticDisplay.Both]: `${pinyin}${separator}${zhuyin}`,
  }[phoneticDisplay];
  return <Text style={[{ fontFamily: ENGLISH_FONT_FAMILY }, style]}>{text}</Text>;
}
