import type { PressableStateCallbackType } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSizes } from '../theme';

/** Large enough to tap comfortably around the single arrow. */
const MINIMUM_TOUCH_SIZE = 44;

interface HeaderBackButtonProps {
  onPress: () => void;
}

/** A back arrow for screen headers that have no screen behind them to go back to. */
export function HeaderBackButton({ onPress }: HeaderBackButtonProps) {
  const buttonStyle = ({ pressed }: PressableStateCallbackType) => [
    styles.button,
    pressed && styles.pressed,
  ];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Navigate up"
      onPress={onPress}
      style={buttonStyle}
    >
      <Text style={styles.arrow}>←</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: MINIMUM_TOUCH_SIZE,
    minHeight: MINIMUM_TOUCH_SIZE,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  arrow: {
    fontSize: fontSizes.heading,
    color: colors.textPrimary,
  },
});
