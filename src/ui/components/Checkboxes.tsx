import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../theme';

export interface CheckboxOption<Value> {
  value: Value;
  label: string;
  /** Shown ticked and greyed out, e.g. a word set the profile already added. */
  isDisabled?: boolean;
}

interface CheckboxesProps<Value> {
  options: readonly CheckboxOption<Value>[];
  selectedValues: ReadonlySet<Value>;
  onToggle: (value: Value) => void;
}

/** A multi-select column of checkboxes. */
export function Checkboxes<Value extends string | number>({
  options,
  selectedValues,
  onToggle,
}: CheckboxesProps<Value>) {
  return (
    <View style={styles.options}>
      {options.map((option) => {
        const isDisabled = option.isDisabled === true;
        const isSelected = isDisabled || selectedValues.has(option.value);
        const accessibilityState = { checked: isSelected, disabled: isDisabled };
        const checkboxStyle = [
          styles.checkbox,
          isSelected && styles.checkedBox,
          isDisabled && styles.disabledBox,
        ];
        const checkmarkStyle = [styles.checkmark, isDisabled && styles.disabledCheckmark];
        const checkmark = isSelected ? <Text style={checkmarkStyle}>✓</Text> : null;
        const labelStyle = [styles.label, isDisabled && styles.disabledLabel];
        return (
          <Pressable
            key={option.value}
            onPress={() => onToggle(option.value)}
            disabled={isDisabled}
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            style={styles.option}
          >
            <View style={checkboxStyle}>{checkmark}</View>
            <Text style={labelStyle}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const CHECKBOX_SIZE = 24;

const styles = StyleSheet.create({
  options: {
    gap: spacing.small,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    paddingVertical: spacing.small,
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: radii.small,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  disabledBox: {
    borderColor: colors.disabled,
    backgroundColor: colors.disabled,
  },
  checkmark: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  disabledCheckmark: {
    color: colors.textSecondary,
  },
  label: {
    flexShrink: 1,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  disabledLabel: {
    color: colors.textSecondary,
  },
});
