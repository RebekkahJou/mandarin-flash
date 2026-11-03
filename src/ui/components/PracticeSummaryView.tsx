import { StyleSheet, Text, View } from 'react-native';

import type { PracticeSummary } from '../hooks/usePracticeSession';
import { colors, fontSizes, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';
import { formatDuration } from './TimerDisplay';

interface PracticeSummaryViewProps {
  summary: PracticeSummary;
  onDone: () => void;
}

export function PracticeSummaryView({ summary, onDone }: PracticeSummaryViewProps) {
  const hasSeparateDeckTime =
    summary.deckCompletedMs !== undefined && summary.deckCompletedMs !== summary.totalElapsedMs;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set complete</Text>
      <SummaryLine label="Total time" value={formatDuration(summary.totalElapsedMs)} />
      {hasSeparateDeckTime && (
        <SummaryLine
          label="Time to get through every card"
          value={formatDuration(summary.deckCompletedMs ?? 0)}
        />
      )}
      <SummaryLine label="Cards in set" value={String(summary.cardCount)} />
      <SummaryLine label="Marked learned" value={String(summary.learnedCount)} />
      <View style={styles.buttonRow}>
        <PrimaryButton label="Done" onPress={onDone} />
      </View>
    </View>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.medium,
  },
  title: {
    fontSize: fontSizes.heading,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.medium,
  },
  label: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
