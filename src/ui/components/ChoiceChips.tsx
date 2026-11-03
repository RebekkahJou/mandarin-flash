import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../theme';

export interface Choice<Value> {
  value: Value;
  label: string;
}

interface ChoiceChipsProps<Value> {
  choices: readonly Choice<Value>[];
  selectedValue: Value;
  onSelect: (value: Value) => void;
}

/** A single-select row of chips, used for set sizes and settings. */
export function ChoiceChips<Value extends string | number>({
  choices,
  selectedValue,
  onSelect,
}: ChoiceChipsProps<Value>) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {choices.map((choice) => {
        const isSelected = choice.value === selectedValue;
        return (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(choice.value)}
            style={[styles.chip, isSelected && styles.selectedChip]}
          >
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>{choice.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  selectedChip: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  selectedLabel: {
    color: colors.primaryText,
  },
});
