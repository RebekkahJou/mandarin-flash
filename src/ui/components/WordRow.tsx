import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Word } from '../../domain/word';
import { FREQUENCY_TIER_LABELS } from '../frequencyTierLabels';
import { ENGLISH_FONT_FAMILY, colors, fontSizes, radii, spacing } from '../theme';
import { ChineseText } from './ChineseText';
import { PhoneticText } from './PhoneticText';

const COLLAPSED_MEANING_LINES = 2;

interface WordRowProps {
  word: Word;
  /** The meanings to show, which may be a list's own meanings rather than the word's. */
  meanings: readonly string[];
  /** Shows every meaning in full instead of cutting the text off after a couple of lines. */
  showsEveryMeaning?: boolean;
  onPress: () => void;
  pressHint: string;
  /** Extra line under the tier, e.g. the lists the word is in. */
  detail?: string;
  /** Shows a remove button when set. */
  onRemove?: () => void;
  /** Highlights the row and explains why, e.g. a noun in the Verbs list. */
  warning?: string;
}

export function WordRow({
  word,
  meanings,
  showsEveryMeaning = false,
  onPress,
  pressHint,
  detail,
  onRemove,
  warning,
}: WordRowProps) {
  const hasWarning = warning !== undefined;
  const rowStyle = [styles.row, hasWarning && styles.warningRow];
  const meaningsText = meanings.join('; ');
  const meaningLineLimit = showsEveryMeaning ? undefined : COLLAPSED_MEANING_LINES;
  const tierLabel = FREQUENCY_TIER_LABELS[word.frequencyTier];
  const warningLine = hasWarning ? <Text style={styles.warning}>⚠ {warning}</Text> : null;
  const detailLine =
    detail === undefined ? null : (
      <Text style={styles.secondary} numberOfLines={2}>
        {detail}
      </Text>
    );
  const removeLabel = `Remove ${word.headword}`;
  const removeButton = onRemove ? (
    <Pressable
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={removeLabel}
      hitSlop={spacing.small}
    >
      <Text style={styles.remove}>✕</Text>
    </Pressable>
  ) : null;
  return (
    <View style={rowStyle}>
      <Pressable
        style={styles.details}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint={pressHint}
      >
        <ChineseText text={word.headword} style={styles.character} />
        <View style={styles.text}>
          <PhoneticText numberedPinyin={word.reading} style={styles.phonetic} />
          <Text style={styles.meanings} numberOfLines={meaningLineLimit}>
            {meaningsText}
          </Text>
          <Text style={styles.secondary}>{tierLabel}</Text>
          {warningLine}
          {detailLine}
        </View>
      </Pressable>
      {removeButton}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: spacing.medium,
    gap: spacing.medium,
  },
  warningRow: {
    borderColor: colors.warning,
    borderWidth: 2,
    backgroundColor: colors.warningSurface,
  },
  warning: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.small,
    fontWeight: '600',
    color: colors.warning,
  },
  details: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  character: {
    fontSize: fontSizes.heading,
    color: colors.textPrimary,
  },
  text: {
    flex: 1,
    gap: spacing.extraSmall,
  },
  phonetic: {
    fontSize: fontSizes.body,
    color: colors.phonetic,
  },
  meanings: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.small,
    color: colors.textPrimary,
  },
  secondary: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
  remove: {
    fontSize: fontSizes.title,
    color: colors.textSecondary,
  },
});
