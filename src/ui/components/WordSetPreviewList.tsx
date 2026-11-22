import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ENGLISH_FONT_FAMILY, colors, fontSizes, spacing } from '../theme';
import { CheckboxMark } from './CheckboxMark';
import { ChineseText } from './ChineseText';
import { CompactButton } from './CompactButton';
import { PhoneticText } from './PhoneticText';

export interface WordSetPreviewEntry {
  /** Identifies the word within the set (headword and reading). */
  key: string;
  headword: string;
  /** Numbered pinyin, shown as the user's phonetic setting. */
  reading: string;
  /** The first curated meaning. */
  meaning: string;
}

export interface WordSetPreviewListProps {
  entries: readonly WordSetPreviewEntry[];
  /** Keys of the words the user unchecked; every other word is checked. */
  skippedKeys: ReadonlySet<string>;
  onToggleEntry: (entryKey: string) => void;
  /** Returns to the sets, keeping the checked words. */
  onBack: () => void;
}

/** One set's words, all checked to start, so the user can leave out words they don't need. */
export function WordSetPreviewList({
  entries,
  skippedKeys,
  onToggleEntry,
  onBack,
}: WordSetPreviewListProps) {
  return (
    <>
      <View style={styles.backRow}>
        <CompactButton label="Back to sets" onPress={onBack} isOutlined />
      </View>
      {entries.map((entry) => {
        const isChecked = !skippedKeys.has(entry.key);
        const accessibilityState = { checked: isChecked };
        return (
          <Pressable
            key={entry.key}
            onPress={() => onToggleEntry(entry.key)}
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            style={styles.row}
          >
            <CheckboxMark isChecked={isChecked} />
            <ChineseText text={entry.headword} style={styles.headword} />
            <View style={styles.text}>
              <PhoneticText numberedPinyin={entry.reading} style={styles.reading} />
              <Text style={styles.meaning}>{entry.meaning}</Text>
            </View>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    paddingVertical: spacing.small,
  },
  headword: {
    fontSize: fontSizes.title,
    color: colors.textPrimary,
  },
  text: {
    flex: 1,
  },
  reading: {
    fontSize: fontSizes.small,
    color: colors.phonetic,
  },
  meaning: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.small,
    color: colors.textPrimary,
  },
});
