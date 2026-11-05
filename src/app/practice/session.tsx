import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { DEFAULT_PRACTICE_SET_SIZE } from '../../domain/practiceSetBuilder';
import type { ExampleSentence } from '../../services/dictionaryLookup';
import { useAppServices } from '../../ui/AppServicesContext';
import { SwipeAnswer } from '../../domain/practiceSwipe';
import { CompactButton } from '../../ui/components/CompactButton';
import { ExampleSentencesModal } from '../../ui/components/ExampleSentencesModal';
import { Flashcard } from '../../ui/components/Flashcard';
import { InfoModal } from '../../ui/components/InfoModal';
import { PracticeSummaryView } from '../../ui/components/PracticeSummaryView';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SwipeableCard } from '../../ui/components/SwipeableCard';
import { TimerDisplay } from '../../ui/components/TimerDisplay';
import { usePracticeSession } from '../../ui/hooks/usePracticeSession';
import { colors, fontSizes, spacing } from '../../ui/theme';

/**
 * The arrow is the swipe direction for each answer (down: the word comes up less often). The
 * ✗ and ✓ matter too: Missed (smoky rose) and Gotten (teal) look alike with deuteranopia and in
 * grayscale, so color alone can't tell them apart.
 */
const ANSWER_BUTTON_LABELS = {
  missed: '← Missed ✗',
  gotten: '→ Gotten ✓',
  learned: '↓ Learned',
} as const;

export default function PracticeSessionScreen() {
  const params = useLocalSearchParams<{ listId: string; setSize: string }>();
  const wordListId = Number(params.listId);
  const setSize = Number(params.setSize) || DEFAULT_PRACTICE_SET_SIZE;
  const practice = usePracticeSession(wordListId, setSize);
  const { dictionaryLookup } = useAppServices();
  const [sentences, setSentences] = useState<ExampleSentence[] | null>(null);

  const showSentences = async () => {
    if (!practice.currentCard) return;
    setSentences(await dictionaryLookup.findExampleSentences(practice.currentCard.word.headword));
  };

  const answerBySwipe = (answer: SwipeAnswer) => {
    const answerActions: Record<SwipeAnswer, () => void> = {
      [SwipeAnswer.Missed]: practice.markMissed,
      [SwipeAnswer.Gotten]: practice.markGotten,
      [SwipeAnswer.Learned]: () => void practice.markLearned(),
    };
    answerActions[answer]();
  };

  if (practice.summary) {
    return (
      <ScreenContainer>
        <PracticeSummaryView summary={practice.summary} onDone={() => router.back()} />
      </ScreenContainer>
    );
  }
  if (practice.isLoading || !practice.currentCard) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.accent} size="large" />
      </ScreenContainer>
    );
  }

  const areSentencesVisible = sentences !== null;
  const shownSentences = sentences ?? [];
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.progress}>
          {practice.progress.completed} / {practice.progress.total} done
        </Text>
        <TimerDisplay elapsedMs={practice.elapsedMs} />
      </View>

      <SwipeableCard onSwipe={answerBySwipe}>
        <Flashcard
          word={practice.currentCard.word}
          definitions={practice.currentCard.definitions}
          font={practice.font}
          isRevealed={practice.isRevealed}
          onReveal={practice.reveal}
        />
      </SwipeableCard>

      <View style={styles.accessoryRow}>
        <CompactButton label="In a sentence" onPress={showSentences} isOutlined />
        <CompactButton label="End" onPress={practice.endSession} isOutlined />
      </View>
      <View style={styles.buttonRow}>
        <PrimaryButton
          label={ANSWER_BUTTON_LABELS.missed}
          isProminent
          accessibilityLabel="Missed"
          onPress={practice.markMissed}
          color={colors.missed}
        />
        <PrimaryButton
          label={ANSWER_BUTTON_LABELS.gotten}
          isProminent
          accessibilityLabel="Gotten"
          onPress={practice.markGotten}
          color={colors.gotten}
        />
        <PrimaryButton
          label={ANSWER_BUTTON_LABELS.learned}
          isProminent
          accessibilityLabel="Learned"
          onPress={practice.markLearned}
          color={colors.learned}
        />
      </View>

      <ExampleSentencesModal
        isVisible={areSentencesVisible}
        sentences={shownSentences}
        onClose={() => setSentences(null)}
      />
      <InfoModal
        isVisible={practice.isDeckCompletePromptVisible}
        onClose={practice.keepGoing}
        closeLabel="Keep going"
      >
        <Text style={styles.promptTitle}>You got every word!</Text>
        <Text style={styles.promptBody}>End the set now, or keep practicing?</Text>
        <View style={styles.buttonRow}>
          <PrimaryButton label="End set" onPress={practice.endSession} />
        </View>
      </InfoModal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  accessoryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.medium,
  },
  promptTitle: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  promptBody: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
});
