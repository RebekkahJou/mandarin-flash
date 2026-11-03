import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WordList } from '../../domain/wordList';
import { colors, fontSizes, radii, spacing } from '../theme';
import { InfoModal } from './InfoModal';

interface ListPickerModalProps {
  isVisible: boolean;
  lists: readonly WordList[];
  selectedListIds: ReadonlySet<number>;
  onToggle: (wordListId: number) => void;
  onClose: () => void;
}

/** Multi-select of the lists a new word should be added to. */
export function ListPickerModal({
  isVisible,
  lists,
  selectedListIds,
  onToggle,
  onClose,
}: ListPickerModalProps) {
  return (
    <InfoModal isVisible={isVisible} onClose={onClose} closeLabel="Done">
      <Text style={styles.title}>Add to which lists?</Text>
      <View style={styles.options}>
        {lists.map((list) => {
          const isSelected = selectedListIds.has(list.id);
          return (
            <Pressable
              key={list.id}
              onPress={() => onToggle(list.id)}
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
    </InfoModal>
  );
}

const CHECKBOX_SIZE = 24;

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
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
