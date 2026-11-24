import { StyleSheet, Text, View } from 'react-native';

import type { PhoneticDisplay } from '../../data/repositories/settingsRepository';
import { SwipeAnswer } from '../../domain/practiceSwipe';
import type { GameWord } from '../../domain/sharedWords';
import type { SpeedRaceCardFront } from '../../domain/speedRace';
import type { CardFontFamily } from '../../services/fontRotation';
import { colors, fontSizes, spacing } from '../theme';
import { GameCard } from './GameCard';
import { PrimaryButton } from './PrimaryButton';
import { SwipeableCard } from './SwipeableCard';
import { TimerDisplay } from './TimerDisplay';

/** The ✗ and ✓ tell the answers apart where their colors look alike (see the practice screen). */
const ANSWER_BUTTON_LABELS = {
  missed: '← Missed ✗',
  gotten: '→ Gotten ✓',
} as const;

interface SpeedRaceTurnViewProps {
  /** e.g. "Round 1 of 3 · Kid" */
  heading: string;
  /** e.g. "3 / 20 done" */
  progressText: string;
  elapsedMs: number;
  word: GameWord;
  front: SpeedRaceCardFront;
  phoneticDisplay: PhoneticDisplay;
  font?: CardFontFamily;
  isRevealed: boolean;
  onReveal: () => void;
  onMissed: () => void;
  onGotten: () => void;
}

/** One player's turn: the card, progress, timer and the Missed and Gotten answers. */
export function SpeedRaceTurnView({
  heading,
  progressText,
  elapsedMs,
  word,
  front,
  phoneticDisplay,
  font,
  isRevealed,
  onReveal,
  onMissed,
  onGotten,
}: SpeedRaceTurnViewProps) {
  const isAnswerDisabled = !isRevealed;
  // Games have no Learned, so a downward swipe does nothing.
  const answerBySwipe = (answer: SwipeAnswer) => {
    if (!isRevealed) return;
    if (answer === SwipeAnswer.Missed) onMissed();
    if (answer === SwipeAnswer.Gotten) onGotten();
  };
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{heading}</Text>
      <View style={styles.header}>
        <Text style={styles.progress}>{progressText}</Text>
        <TimerDisplay elapsedMs={elapsedMs} />
      </View>
      <SwipeableCard onSwipe={answerBySwipe}>
        <GameCard
          word={word}
          front={front}
          phoneticDisplay={phoneticDisplay}
          font={font}
          isRevealed={isRevealed}
          onReveal={onReveal}
        />
      </SwipeableCard>
      <View style={styles.buttonRow}>
        <PrimaryButton
          label={ANSWER_BUTTON_LABELS.missed}
          accessibilityLabel="Missed"
          isProminent
          isDisabled={isAnswerDisabled}
          onPress={onMissed}
          color={colors.missed}
        />
        <PrimaryButton
          label={ANSWER_BUTTON_LABELS.gotten}
          accessibilityLabel="Gotten"
          isProminent
          isDisabled={isAnswerDisabled}
          onPress={onGotten}
          color={colors.gotten}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.medium,
  },
  heading: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progress: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.small,
  },
});
