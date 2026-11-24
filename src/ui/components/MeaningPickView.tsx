import { StyleSheet, Text, View } from 'react-native';

import type { PhoneticDisplay } from '../../data/repositories/settingsRepository';
import type { Word } from '../../domain/word';
import { colors, fontSizes, spacing } from '../theme';
import { WordRow } from './WordRow';

/** A word the picker can choose, keyed by its id. */
export interface PickableWord {
  key: number;
  word: Word;
  onPick: () => void;
}

interface MeaningPickViewProps {
  /** e.g. "Turn 3 of 10" */
  stepLabel: string;
  /** e.g. "Me, pick a word for the other player" */
  title: string;
  /** e.g. "Kid will see its meaning and look for the word." */
  hint: string;
  words: readonly PickableWord[];
  /** The picker's own pinyin or zhuyin setting. */
  phoneticDisplay: PhoneticDisplay;
}

/** The picker's turn: shared words in their own language, one to choose for the other player. */
export function MeaningPickView({
  stepLabel,
  title,
  hint,
  words,
  phoneticDisplay,
}: MeaningPickViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.step}>{stepLabel}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <View style={styles.list}>
        {words.map(({ key, word, onPick }) => (
          <WordRow
            key={key}
            word={word}
            meanings={word.definitions}
            onPress={onPick}
            pressHint="Picks this word"
            showsLearningLevel={false}
            phoneticDisplay={phoneticDisplay}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.medium,
  },
  step: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.small,
  },
});
