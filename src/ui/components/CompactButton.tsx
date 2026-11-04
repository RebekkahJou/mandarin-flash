import type { PressableStateCallbackType } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../theme';

/** Large enough to tap comfortably, even when the label is a single symbol. */
const MINIMUM_TOUCH_SIZE = 44;

interface CompactButtonProps {
  label: string;
  onPress: () => void;
  /** Read aloud instead of the label, for symbol-only buttons such as "+". */
  accessibilityLabel?: string;
  isOutlined?: boolean;
}

/** A button sized to its label, for headings and toolbars where PrimaryButton would stretch. */
export function CompactButton({
  label,
  onPress,
  accessibilityLabel = label,
  isOutlined = false,
}: CompactButtonProps) {
  const buttonStyle = ({ pressed }: PressableStateCallbackType) => [
    styles.button,
    isOutlined && styles.outlinedButton,
    pressed && styles.pressed,
  ];
  const labelStyle = [styles.label, isOutlined && styles.outlinedLabel];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={buttonStyle}
    >
      <Text style={labelStyle}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: MINIMUM_TOUCH_SIZE,
    minHeight: MINIMUM_TOUCH_SIZE,
    paddingHorizontal: spacing.medium,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinedButton: {
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  outlinedLabel: {
    color: colors.primary,
  },
});
