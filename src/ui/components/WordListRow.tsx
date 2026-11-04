import type { PressableStateCallbackType } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatWordCount } from '../../services/wordCount';

import { colors, fontSizes, radii, spacing } from '../theme';

interface WordListRowProps {
  name: string;
  wordCount: number;
  isSelected?: boolean;
  /** Teal styling for a row that isn't an ordinary list, such as All words. */
  isFeatured?: boolean;
  onPress: () => void;
}

/** One word list with its size; used for choosing a list to practice and for browsing lists. */
export function WordListRow({
  name,
  wordCount,
  isSelected = false,
  isFeatured = false,
  onPress,
}: WordListRowProps) {
  const accessibilityState = { selected: isSelected };
  const rowStyle = ({ pressed }: PressableStateCallbackType) => [
    styles.row,
    isFeatured && styles.featuredRow,
    isSelected && styles.selectedRow,
    pressed && styles.pressed,
  ];
  const wordCountLabel = formatWordCount(wordCount);
  const nameStyle = [styles.name, isFeatured && styles.featuredText];
  const countStyle = [styles.count, isFeatured && styles.featuredText];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      style={rowStyle}
    >
      <Text style={nameStyle}>{name}</Text>
      <View style={styles.countBadge}>
        <Text style={countStyle}>{wordCountLabel}</Text>
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
  featuredRow: {
    borderColor: colors.feature,
    backgroundColor: colors.feature,
  },
  featuredText: {
    color: colors.onFeature,
  },
  selectedRow: {
    borderColor: colors.accentStrong,
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
