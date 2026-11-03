import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  isDisabled?: boolean;
  isOutlined?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  color = colors.primary,
  isDisabled = false,
  isOutlined = false,
}: PrimaryButtonProps) {
  const activeColor = isDisabled ? colors.disabled : color;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isOutlined
          ? { borderColor: activeColor, backgroundColor: colors.surface }
          : { borderColor: activeColor, backgroundColor: activeColor },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: isOutlined ? activeColor : colors.primaryText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 48,
    borderWidth: 2,
    borderRadius: radii.medium,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: '600',
  },
});
