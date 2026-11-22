import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, spacing } from '../theme';
import { CheckboxMark } from './CheckboxMark';

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
            <CheckboxMark isChecked={isSelected} isDisabled={isDisabled} />
            <Text style={labelStyle}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  label: {
    flexShrink: 1,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  disabledLabel: {
    color: colors.textSecondary,
  },
});
