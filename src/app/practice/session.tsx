import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { DEFAULT_PRACTICE_SET_SIZE } from '../../domain/practiceSetBuilder';
import type { ExampleSentence } from '../../services/dictionaryLookup';
import { useAppServices } from '../../ui/AppServicesContext';
import { ExampleSentencesModal } from '../../ui/components/ExampleSentencesModal';
import { Flashcard } from '../../ui/components/Flashcard';
import { InfoModal } from '../../ui/components/InfoModal';
import { PracticeSummaryView } from '../../ui/components/PracticeSummaryView';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { TimerDisplay } from '../../ui/components/TimerDisplay';
import { usePracticeSession } from '../../ui/hooks/usePracticeSession';
import { colors, fontSizes, spacing } from '../../ui/theme';

export default function PracticeSessionScreen() {
  const params = useLocalSearchParams<{ listId: string; setSize: string }>();
  const wordListId = Number(params.listId);
  const setSize = Number(params.setSize) || DEFAULT_PRACTICE_SET_SIZE;
  const practice = usePracticeSession(wordListId, setSize);
  const { dictionaryLookup } = useAppServices();
  const [sentences, setSentences] = useState<ExampleSentence[] | null>(null);

  const showSentences = async () => {
    if (!practice.currentCard) return;
    setSentences(
      await dictionaryLookup.findExampleSentences(practice.currentCard.word.traditional),
    );
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
        <ActivityIndicator color={colors.primary} size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.progress}>
          {practice.progress.completed} / {practice.progress.total} done
        </Text>
        <TimerDisplay elapsedMs={practice.elapsedMs} />
      </View>

      <Flashcard
        word={practice.currentCard.word}
        definitions={practice.currentCard.definitions}
        font={practice.font}
        isRevealed={practice.isRevealed}
        onReveal={practice.reveal}
      />

      <View style={styles.buttonRow}>
        <PrimaryButton label="In a sentence" onPress={showSentences} isOutlined />
        <PrimaryButton label="End" onPress={practice.endSession} isOutlined />
      </View>
      <View style={styles.buttonRow}>
        <PrimaryButton label="Missed" onPress={practice.markMissed} color={colors.missed} />
        <PrimaryButton label="Gotten" onPress={practice.markGotten} color={colors.gotten} />
        <PrimaryButton label="Learned" onPress={practice.markLearned} color={colors.learned} />
      </View>

      <ExampleSentencesModal
        isVisible={sentences !== null}
        sentences={sentences ?? []}
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
