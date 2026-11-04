import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SimplifiedDisplay } from '../../data/repositories/settingsRepository';
import type { Word } from '../../domain/word';
import type { ChineseFontFamily } from '../../services/fontRotation';
import { useSettings } from '../AppServicesContext';
import { ENGLISH_FONT_FAMILY, colors, fontSizes, radii, spacing } from '../theme';
import { ChineseText } from './ChineseText';
import { InfoModal } from './InfoModal';
import { PhoneticText } from './PhoneticText';

interface FlashcardProps {
  word: Word;
  definitions: readonly string[];
  font: ChineseFontFamily;
  isRevealed: boolean;
  onReveal: () => void;
}

const SINGLE_CHARACTER_LENGTH = 1;

/** Shows the character; tapping reveals pinyin/Zhuyin and English. */
export function Flashcard({ word, definitions, font, isRevealed, onReveal }: FlashcardProps) {
  const { simplifiedDisplay } = useSettings().settings;
  const [isSimplifiedModalVisible, setIsSimplifiedModalVisible] = useState(false);
  const hasSimplifiedForm = word.simplified !== undefined && word.simplified !== word.traditional;
  const characterSize =
    [...word.traditional].length <= SINGLE_CHARACTER_LENGTH
      ? fontSizes.flashcardCharacter
      : fontSizes.flashcardPhrase;
  const characterStyle = { ...styles.character, fontSize: characterSize };
  const simplifiedText = word.simplified ?? '';
  const revealHint = isRevealed ? undefined : 'Reveals pronunciation and meaning';
  const simplifiedForm = simplifiedIndicator(
    hasSimplifiedForm,
    simplifiedDisplay,
    simplifiedText,
    () => setIsSimplifiedModalVisible(true),
  );
  const answer = isRevealed ? (
    <>
      <PhoneticText numberedPinyin={word.pinyin} style={styles.phonetic} />
      {definitions.map((definition) => (
        <Text key={definition} style={styles.definition}>
          {definition}
        </Text>
      ))}
    </>
  ) : (
    <Text style={styles.hint}>Tap to reveal</Text>
  );

  return (
    <Pressable
      style={styles.card}
      onPress={onReveal}
      accessibilityRole="button"
      accessibilityHint={revealHint}
    >
      {simplifiedForm}

      <ChineseText text={word.traditional} font={font} style={characterStyle} />

      <View style={styles.answer}>{answer}</View>

      <InfoModal
        isVisible={isSimplifiedModalVisible}
        onClose={() => setIsSimplifiedModalVisible(false)}
      >
        <Text style={styles.modalLabel}>Simplified</Text>
        <ChineseText text={simplifiedText} style={styles.modalCharacter} />
      </InfoModal>
    </Pressable>
  );
}

/** The corner badge or the button that opens the Simplified modal, depending on Settings. */
function simplifiedIndicator(
  hasSimplifiedForm: boolean,
  simplifiedDisplay: SimplifiedDisplay,
  simplifiedText: string,
  onShowModal: () => void,
) {
  if (!hasSimplifiedForm) return null;
  if (simplifiedDisplay === SimplifiedDisplay.CornerBadge) {
    const badgeLabel = `Simplified: ${simplifiedText}`;
    return (
      <Text style={styles.simplifiedBadge} accessibilityLabel={badgeLabel}>
        简 {simplifiedText}
      </Text>
    );
  }
  if (simplifiedDisplay === SimplifiedDisplay.ModalButton) {
    return (
      <Pressable
        style={styles.simplifiedButton}
        onPress={onShowModal}
        accessibilityRole="button"
        accessibilityLabel="Show simplified form"
      >
        <Text style={styles.simplifiedButtonLabel}>简</Text>
      </Pressable>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  character: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
    gap: spacing.large,
  },
  answer: {
    minHeight: 120,
    alignItems: 'center',
    gap: spacing.small,
  },
  phonetic: {
    fontSize: fontSizes.heading,
    color: colors.phonetic,
  },
  definition: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  hint: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  simplifiedBadge: {
    position: 'absolute',
    top: spacing.medium,
    right: spacing.medium,
    fontSize: fontSizes.title,
    color: colors.textSecondary,
  },
  simplifiedButton: {
    position: 'absolute',
    top: spacing.medium,
    right: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.extraSmall,
  },
  simplifiedButtonLabel: {
    fontSize: fontSizes.title,
    color: colors.textSecondary,
  },
  modalLabel: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  modalCharacter: {
    fontSize: fontSizes.flashcardPhrase,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
