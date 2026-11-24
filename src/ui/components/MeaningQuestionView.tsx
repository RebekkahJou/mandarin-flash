import { StyleSheet, Text, View } from 'react-native';

import { ENGLISH_FONT_FAMILY, colors, fontSizes, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

/** One of the answerer's choices. */
export interface MeaningOption {
  key: number;
  /** The word, with ✓ or ✗ once answered. */
  label: string;
  onChoose: () => void;
}

/** Shown after answering: whether it was right, and the right word. */
export interface MeaningFeedback {
  title: string;
  /** The right word with its reading, e.g. "老師 lǎo shī". */
  answerText: string;
  onNext: () => void;
  nextLabel: string;
}

interface MeaningQuestionViewProps {
  /** e.g. "Turn 3 of 10 · Kid" */
  heading: string;
  prompt: string;
  meanings: readonly string[];
  options: readonly MeaningOption[];
  /** Null until the answerer chooses. */
  feedback: MeaningFeedback | null;
}

/** The answerer's turn: a word's meanings and 4 words to choose from in their own language. */
export function MeaningQuestionView({
  heading,
  prompt,
  meanings,
  options,
  feedback,
}: MeaningQuestionViewProps) {
  const isAnswered = feedback !== null;
  const feedbackSection = feedback ? (
    <View style={styles.feedback}>
      <Text style={styles.feedbackTitle}>{feedback.title}</Text>
      <Text style={styles.answer}>{feedback.answerText}</Text>
      <View style={styles.buttonRow}>
        <PrimaryButton label={feedback.nextLabel} onPress={feedback.onNext} />
      </View>
    </View>
  ) : null;
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.meanings}>
        {meanings.map((meaning) => (
          <Text key={meaning} style={styles.meaning}>
            {meaning}
          </Text>
        ))}
      </View>
      <View style={styles.options}>
        {options.map(({ key, label, onChoose }) => (
          <View key={key} style={styles.buttonRow}>
            <PrimaryButton
              label={label}
              onPress={onChoose}
              isOutlined
              isProminent
              isDisabled={isAnswered}
            />
          </View>
        ))}
      </View>
      {feedbackSection}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.medium,
  },
  heading: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  prompt: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  meanings: {
    gap: spacing.extraSmall,
    alignItems: 'center',
  },
  meaning: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  options: {
    gap: spacing.small,
  },
  feedback: {
    gap: spacing.small,
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: fontSizes.heading,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  answer: {
    fontSize: fontSizes.title,
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
