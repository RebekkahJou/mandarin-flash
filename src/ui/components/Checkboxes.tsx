import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../theme';

export interface CheckboxOption<Value> {
  value: Value;
  label: string;
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
        const isSelected = selectedValues.has(option.value);
        const accessibilityState = { checked: isSelected };
        const checkboxStyle = [styles.checkbox, isSelected && styles.checkedBox];
        const checkmark = isSelected ? <Text style={styles.checkmark}>✓</Text> : null;
        return (
          <Pressable
            key={option.value}
            onPress={() => onToggle(option.value)}
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            style={styles.option}
          >
            <View style={checkboxStyle}>{checkmark}</View>
            <Text style={styles.label}>{option.label}</Text>
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
  checkmark: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  label: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
});
