import { StyleSheet, Text, View } from 'react-native';

import type { ExampleSentence } from '../../services/dictionaryLookup';
import { ENGLISH_FONT_FAMILY, colors, fontSizes, spacing } from '../theme';
import { ChineseText } from './ChineseText';
import { InfoModal } from './InfoModal';

interface ExampleSentencesModalProps {
  isVisible: boolean;
  sentences: readonly ExampleSentence[];
  onClose: () => void;
}

export function ExampleSentencesModal({
  isVisible,
  sentences,
  onClose,
}: ExampleSentencesModalProps) {
  const sentenceViews = sentences.map((sentence) => (
    <View key={sentence.traditional} style={styles.sentence}>
      <ChineseText text={sentence.traditional} style={styles.chinese} />
      <Text style={styles.english}>{sentence.english}</Text>
    </View>
  ));
  const content =
    sentences.length === 0 ? (
      <Text style={styles.english}>No example sentence is available for this word yet.</Text>
    ) : (
      sentenceViews
    );
  return (
    <InfoModal isVisible={isVisible} onClose={onClose}>
      <Text style={styles.title}>In a sentence</Text>
      {content}
      <Text style={styles.attribution}>Sentences from Tatoeba (CC BY 2.0 FR)</Text>
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sentence: {
    gap: spacing.extraSmall,
  },
  chinese: {
    fontSize: fontSizes.title,
    color: colors.textPrimary,
  },
  english: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  attribution: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
});
