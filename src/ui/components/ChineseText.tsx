import type { TextStyle } from 'react-native';
import { Text } from 'react-native';

import type { ChineseFontFamily } from '../../services/fontRotation';
import { SYSTEM_CHINESE_FONT, fontForText } from '../../services/fontRotation';

interface ChineseTextProps {
  text: string;
  font?: ChineseFontFamily;
  style?: TextStyle;
}

/** Chinese characters in a rotating font, falling back to the system font for rare characters. */
export function ChineseText({ text, font = SYSTEM_CHINESE_FONT, style }: ChineseTextProps) {
  const resolvedFont = fontForText(font, text);
  const fontFamily = resolvedFont === SYSTEM_CHINESE_FONT ? undefined : resolvedFont;
  return <Text style={[style, { fontFamily }]}>{text}</Text>;
}
