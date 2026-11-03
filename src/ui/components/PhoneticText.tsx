import type { TextStyle } from 'react-native';
import { Text } from 'react-native';

import { PhoneticDisplay } from '../../data/repositories/settingsRepository';
import { toToneMarkedPinyin, toZhuyin } from '../../services/pinyin';
import { useSettings } from '../AppServicesContext';
import { ENGLISH_FONT_FAMILY } from '../theme';

interface PhoneticTextProps {
  numberedPinyin: string;
  style?: TextStyle;
}

/** Shows pinyin, Zhuyin or both, following the user's setting. Zhuyin is derived, never stored. */
export function PhoneticText({ numberedPinyin, style }: PhoneticTextProps) {
  const { phoneticDisplay } = useSettings().settings;
  const pinyin = toToneMarkedPinyin(numberedPinyin);
  const zhuyin = toZhuyin(numberedPinyin);
  const text = {
    [PhoneticDisplay.Pinyin]: pinyin,
    [PhoneticDisplay.Zhuyin]: zhuyin,
    [PhoneticDisplay.Both]: `${pinyin}  ${zhuyin}`,
  }[phoneticDisplay];
  return <Text style={[{ fontFamily: ENGLISH_FONT_FAMILY }, style]}>{text}</Text>;
}
