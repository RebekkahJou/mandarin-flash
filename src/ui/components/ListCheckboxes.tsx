import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WordList } from '../../domain/wordList';
import { colors, fontSizes, radii, spacing } from '../theme';

interface ListCheckboxesProps {
  lists: readonly WordList[];
  selectedListIds: ReadonlySet<number>;
  onToggle: (wordList: WordList) => void;
}

/** One checkbox per word list, for choosing which lists a word belongs to. */
export function ListCheckboxes({ lists, selectedListIds, onToggle }: ListCheckboxesProps) {
  return (
    <View style={styles.options}>
      {lists.map((list) => {
        const isSelected = selectedListIds.has(list.id);
        return (
          <Pressable
            key={list.id}
            onPress={() => onToggle(list)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            style={styles.option}
          >
            <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.listName}>{list.name}</Text>
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
    color: colors.primaryText,
    fontWeight: '700',
  },
  listName: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
});
