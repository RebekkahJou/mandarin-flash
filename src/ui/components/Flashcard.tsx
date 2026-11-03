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

  return (
    <Pressable
      style={styles.card}
      onPress={onReveal}
      accessibilityRole="button"
      accessibilityHint={isRevealed ? undefined : 'Reveals pronunciation and meaning'}
    >
      {hasSimplifiedForm && simplifiedDisplay === SimplifiedDisplay.CornerBadge && (
        <Text style={styles.simplifiedBadge} accessibilityLabel={`Simplified: ${word.simplified}`}>
          简 {word.simplified}
        </Text>
      )}
      {hasSimplifiedForm && simplifiedDisplay === SimplifiedDisplay.ModalButton && (
        <Pressable
          style={styles.simplifiedButton}
          onPress={() => setIsSimplifiedModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Show simplified form"
        >
          <Text style={styles.simplifiedButtonLabel}>简</Text>
        </Pressable>
      )}

      <ChineseText
        text={word.traditional}
        font={font}
        style={{ fontSize: characterSize, color: colors.textPrimary, textAlign: 'center' }}
      />

      <View style={styles.answer}>
        {isRevealed ? (
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
        )}
      </View>

      <InfoModal
        isVisible={isSimplifiedModalVisible}
        onClose={() => setIsSimplifiedModalVisible(false)}
      >
        <Text style={styles.modalLabel}>Simplified</Text>
        <ChineseText text={word.simplified ?? ''} style={styles.modalCharacter} />
      </InfoModal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    color: colors.primary,
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
