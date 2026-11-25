import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ENGLISH_FONT_FAMILY, colors, fontSizes, spacing } from '../theme';
import { CheckboxMark } from './CheckboxMark';
import { ChineseText } from './ChineseText';
import { PhoneticText } from './PhoneticText';

export interface CheckableWord {
  /** Identifies the word among the rows (headword and reading). */
  key: string;
  headword: string;
  /** Numbered pinyin, shown as the user's phonetic setting. */
  reading: string;
  /** The first meaning. */
  meaning: string;
  /** A short remark under the meaning, e.g. "Already added". */
  note?: string;
}

export interface CheckableWordRowsProps {
  words: readonly CheckableWord[];
  /** Keys of the unchecked words; every other word is checked. */
  uncheckedKeys: ReadonlySet<string>;
  onToggle: (wordKey: string) => void;
}

function CheckableWordRow({
  word,
  uncheckedKeys,
  onToggle,
}: {
  word: CheckableWord;
  uncheckedKeys: ReadonlySet<string>;
  onToggle: (wordKey: string) => void;
}) {
  const isChecked = !uncheckedKeys.has(word.key);
  const accessibilityState = { checked: isChecked };
  const note = word.note ? <Text style={styles.note}>{word.note}</Text> : null;
  return (
    <Pressable
      onPress={() => onToggle(word.key)}
      accessibilityRole="checkbox"
      accessibilityState={accessibilityState}
      style={styles.row}
    >
      <CheckboxMark isChecked={isChecked} />
      <ChineseText text={word.headword} style={styles.headword} />
      <View style={styles.text}>
        <PhoneticText numberedPinyin={word.reading} style={styles.reading} />
        <Text style={styles.meaning}>{word.meaning}</Text>
        {note}
      </View>
    </Pressable>
  );
}

/** Words with checkboxes, so the user can leave out the ones they don't need. */
export function CheckableWordRows({ words, uncheckedKeys, onToggle }: CheckableWordRowsProps) {
  return (
    <>
      {words.map((word) => (
        <CheckableWordRow
          key={word.key}
          word={word}
          uncheckedKeys={uncheckedKeys}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
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
  note: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
});
