import type { TextStyle } from 'react-native';
import { Text } from 'react-native';

import type { PhoneticDisplay } from '../../data/repositories/settingsRepository';
import { phoneticText } from '../../services/phoneticText';
import { useSettings } from '../AppServicesContext';
import { ENGLISH_FONT_FAMILY } from '../theme';

interface PhoneticTextProps {
  numberedPinyin: string;
  style?: TextStyle;
  /** With both readings shown, puts pinyin on one line and zhuyin on the line below. */
  isStacked?: boolean;
  /** Another profile's setting, e.g. the other player's in a game; the active profile's by default. */
  phoneticDisplay?: PhoneticDisplay;
}

/** Shows pinyin, Zhuyin or both, following the user's setting. Zhuyin is derived, never stored. */
export function PhoneticText({
  numberedPinyin,
  style,
  isStacked = false,
  phoneticDisplay,
}: PhoneticTextProps) {
  const { settings } = useSettings();
  const text = phoneticText(numberedPinyin, phoneticDisplay ?? settings.phoneticDisplay, isStacked);
  return <Text style={[{ fontFamily: ENGLISH_FONT_FAMILY }, style]}>{text}</Text>;
}
