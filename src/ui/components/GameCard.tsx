import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PhoneticDisplay } from '../../data/repositories/settingsRepository';
import type { GameWord } from '../../domain/sharedWords';
import { SpeedRaceCardFront } from '../../domain/speedRace';
import type { CardFontFamily } from '../../services/fontRotation';
import { ENGLISH_FONT_FAMILY, colors, fontSizes, radii, spacing } from '../theme';
import { ChineseText } from './ChineseText';
import { PhoneticText } from './PhoneticText';

const SINGLE_CHARACTER_LENGTH = 1;

interface GameCardProps {
  word: GameWord;
  /** Which side shows before the card is revealed. */
  front: SpeedRaceCardFront;
  /** The player's own pinyin or zhuyin setting. */
  phoneticDisplay: PhoneticDisplay;
  font?: CardFontFamily;
  isRevealed: boolean;
  onReveal: () => void;
}

/** A game flashcard: the word or its meaning first, and tapping reveals the rest. */
export function GameCard({
  word,
  front,
  phoneticDisplay,
  font,
  isRevealed,
  onReveal,
}: GameCardProps) {
  const characterSize =
    [...word.headword].length <= SINGLE_CHARACTER_LENGTH
      ? fontSizes.flashcardCharacter
      : fontSizes.flashcardPhrase;
  const characterStyle = { ...styles.character, fontSize: characterSize };
  const headword = <ChineseText text={word.headword} font={font} style={characterStyle} />;
  const reading = (
    <PhoneticText
      numberedPinyin={word.reading}
      phoneticDisplay={phoneticDisplay}
      style={styles.phonetic}
      isStacked
    />
  );
  const meanings = word.definitions.map((definition) => (
    <Text key={definition} style={styles.definition}>
      {definition}
    </Text>
  ));
  const isWordFirst = front === SpeedRaceCardFront.Word;
  const shownFirst = isWordFirst ? headword : <View style={styles.answer}>{meanings}</View>;
  const revealedMeanings = isWordFirst ? meanings : null;
  const revealedHeadword = isWordFirst ? null : headword;
  const answer = isRevealed ? (
    <View style={styles.answer}>
      {revealedHeadword}
      {reading}
      {revealedMeanings}
    </View>
  ) : (
    <Text style={styles.hint}>Tap to reveal</Text>
  );
  const revealHint = isRevealed ? undefined : 'Reveals the answer';

  return (
    <Pressable
      style={styles.card}
      onPress={onReveal}
      accessibilityRole="button"
      accessibilityHint={revealHint}
    >
      {shownFirst}
      {answer}
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
  character: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  answer: {
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
});
