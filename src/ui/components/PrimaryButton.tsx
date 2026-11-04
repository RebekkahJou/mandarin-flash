import type { PressableStateCallbackType } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../theme';

const PROMINENT_BUTTON_HEIGHT = 72;

/** Labels shrink this far, at most, to stay on one line in narrow buttons. */
const MINIMUM_LABEL_SCALE = 0.8;

interface PrimaryButtonProps {
  label: string;
  /** Read aloud instead of the label, e.g. when the label starts with a symbol. */
  accessibilityLabel?: string;
  onPress: () => void;
  /** Fill color, or the outline and label color when outlined. Must be readable under white. */
  color?: string;
  isDisabled?: boolean;
  isOutlined?: boolean;
  /** Taller with larger text, for a screen's main actions (e.g. the practice answers). */
  isProminent?: boolean;
}

interface ButtonColors {
  borderColor: string;
  backgroundColor: string;
  labelColor: string;
}

function buttonColors({
  color = colors.primary,
  isDisabled = false,
  isOutlined = false,
}: Omit<
  PrimaryButtonProps,
  'label' | 'accessibilityLabel' | 'onPress' | 'isProminent'
>): ButtonColors {
  if (isOutlined) {
    const outlineColor = isDisabled ? colors.disabled : color;
    const outlineLabelColor = isDisabled ? colors.textSecondary : outlineColor;
    return {
      borderColor: outlineColor,
      backgroundColor: colors.surface,
      labelColor: outlineLabelColor,
    };
  }
  if (isDisabled) {
    return {
      borderColor: colors.disabled,
      backgroundColor: colors.disabled,
      labelColor: colors.textSecondary,
    };
  }
  return { borderColor: color, backgroundColor: color, labelColor: colors.onPrimary };
}

export function PrimaryButton({
  label,
  accessibilityLabel = label,
  onPress,
  color,
  isDisabled = false,
  isOutlined = false,
  isProminent = false,
}: PrimaryButtonProps) {
  const resolvedColors = buttonColors({ color, isDisabled, isOutlined });
  const accessibilityState = { disabled: isDisabled };
  const buttonStyle = ({ pressed }: PressableStateCallbackType) => [
    styles.button,
    isProminent && styles.prominentButton,
    {
      borderColor: resolvedColors.borderColor,
      backgroundColor: resolvedColors.backgroundColor,
    },
    pressed && styles.pressed,
  ];
  const labelStyle = [
    styles.label,
    isProminent && styles.prominentLabel,
    { color: resolvedColors.labelColor },
  ];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={isDisabled}
      onPress={onPress}
      style={buttonStyle}
    >
      <Text
        style={labelStyle}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={MINIMUM_LABEL_SCALE}
      >
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
  prominentButton: {
    minHeight: PROMINENT_BUTTON_HEIGHT,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: '600',
  },
  prominentLabel: {
    fontSize: fontSizes.title,
  },
});
