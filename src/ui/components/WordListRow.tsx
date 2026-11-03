import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../theme';

interface WordListRowProps {
  name: string;
  wordCount: number;
  isSelected?: boolean;
  onPress: () => void;
}

/** One word list with its size; used for choosing a list to practice and for browsing lists. */
export function WordListRow({ name, wordCount, isSelected = false, onPress }: WordListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [
        styles.row,
        isSelected && styles.selectedRow,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.name}>{name}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.count}>
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: spacing.medium,
  },
  selectedRow: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: spacing.small,
  },
  count: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
});
