import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WordListEntry } from '../../domain/wordList';
import { definitionsForEntry } from '../../domain/wordList';
import { FrequencyTier } from '../../domain/frequencyTier';
import { ENGLISH_FONT_FAMILY, colors, fontSizes, radii, spacing } from '../theme';
import { ChineseText } from './ChineseText';
import { PhoneticText } from './PhoneticText';

const TIER_LABELS: Readonly<Record<FrequencyTier, string>> = {
  [FrequencyTier.HighIncidence]: 'High incidence',
  [FrequencyTier.MemoryReinforcement]: 'Reinforcement',
  [FrequencyTier.Retention]: 'Retention',
};

interface WordEntryRowProps {
  entry: WordListEntry;
  onEditMeanings: () => void;
  onRemove: () => void;
}

export function WordEntryRow({ entry, onEditMeanings, onRemove }: WordEntryRowProps) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.details}
        onPress={onEditMeanings}
        accessibilityRole="button"
        accessibilityHint="Edit meanings in this list"
      >
        <ChineseText text={entry.word.traditional} style={styles.character} />
        <View style={styles.text}>
          <PhoneticText numberedPinyin={entry.word.pinyin} style={styles.phonetic} />
          <Text style={styles.meanings} numberOfLines={2}>
            {definitionsForEntry(entry).join('; ')}
          </Text>
          <Text style={styles.tier}>{TIER_LABELS[entry.word.frequencyTier]}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${entry.word.traditional}`}
        hitSlop={spacing.small}
      >
        <Text style={styles.remove}>✕</Text>
      </Pressable>
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
    color: colors.primary,
  },
  meanings: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.small,
    color: colors.textPrimary,
  },
  tier: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
  remove: {
    fontSize: fontSizes.title,
    color: colors.textSecondary,
  },
});
