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

/** How the word's other written form is named, e.g. "Simplified" and 简. */
export interface VariantLabels {
  name: string;
  symbol: string;
}

interface FlashcardProps {
  word: Word;
  definitions: readonly string[];
  font: ChineseFontFamily;
  variantLabels: VariantLabels;
  isRevealed: boolean;
  onReveal: () => void;
}

const SINGLE_CHARACTER_LENGTH = 1;

/** Shows the character; tapping reveals pinyin/Zhuyin and English. */
export function Flashcard({
  word,
  definitions,
  font,
  variantLabels,
  isRevealed,
  onReveal,
}: FlashcardProps) {
  // The stored setting keeps its original name; it controls whichever form is the variant.
  const { simplifiedDisplay: variantDisplay } = useSettings().settings;
  const [isVariantModalVisible, setIsVariantModalVisible] = useState(false);
  const hasVariantForm = word.variant !== undefined && word.variant !== word.headword;
  const characterSize =
    [...word.headword].length <= SINGLE_CHARACTER_LENGTH
      ? fontSizes.flashcardCharacter
      : fontSizes.flashcardPhrase;
  const characterStyle = { ...styles.character, fontSize: characterSize };
  const variantText = word.variant ?? '';
  const revealHint = isRevealed ? undefined : 'Reveals pronunciation and meaning';
  const variantForm = variantIndicator({
    hasVariantForm,
    variantDisplay,
    variantText,
    variantLabels,
    onShowModal: () => setIsVariantModalVisible(true),
  });
  const answer = isRevealed ? (
    <>
      <PhoneticText numberedPinyin={word.reading} style={styles.phonetic} />
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
      {variantForm}

      <ChineseText text={word.headword} font={font} style={characterStyle} />

      <View style={styles.answer}>{answer}</View>

      <InfoModal isVisible={isVariantModalVisible} onClose={() => setIsVariantModalVisible(false)}>
        <Text style={styles.modalLabel}>{variantLabels.name}</Text>
        <ChineseText text={variantText} style={styles.modalCharacter} />
      </InfoModal>
    </Pressable>
  );
}

interface VariantIndicatorOptions {
  hasVariantForm: boolean;
  variantDisplay: SimplifiedDisplay;
  variantText: string;
  variantLabels: VariantLabels;
  onShowModal: () => void;
}

/** The corner badge or the button that opens the variant modal, depending on Settings. */
function variantIndicator({
  hasVariantForm,
  variantDisplay,
  variantText,
  variantLabels,
  onShowModal,
}: VariantIndicatorOptions) {
  if (!hasVariantForm) return null;
  if (variantDisplay === SimplifiedDisplay.CornerBadge) {
    const badgeLabel = `${variantLabels.name}: ${variantText}`;
    const badgeText = `${variantLabels.symbol} ${variantText}`;
    return (
      <Text style={styles.simplifiedBadge} accessibilityLabel={badgeLabel}>
        {badgeText}
      </Text>
    );
  }
  if (variantDisplay === SimplifiedDisplay.ModalButton) {
    const buttonLabel = `Show ${variantLabels.name.toLowerCase()} form`;
    return (
      <Pressable
        style={styles.simplifiedButton}
        onPress={onShowModal}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
      >
        <Text style={styles.simplifiedButtonLabel}>{variantLabels.symbol}</Text>
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
