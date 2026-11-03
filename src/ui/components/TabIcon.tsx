import type { ColorValue } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { fontSizes } from '../theme';

interface TabIconProps {
  character: string;
  color: ColorValue;
}

/** A single Chinese character as a tab icon, so the app needs no icon font. */
export function TabIcon({ character, color }: TabIconProps) {
  return (
    <Text
      style={[styles.icon, { color }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {character}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: fontSizes.tabIcon,
  },
});
