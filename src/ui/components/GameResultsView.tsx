import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

interface GameResultsViewProps {
  /** Who won, e.g. "Kid wins!". */
  title: string;
  /** The scores, one line each, e.g. "Round 1: Me 1:23, Kid 1:40". */
  lines: readonly string[];
  onDone: () => void;
}

/** The end of a game: the winner and the scores. */
export function GameResultsView({ title, lines, onDone }: GameResultsViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.lines}>
        {lines.map((line) => (
          <Text key={line} style={styles.line}>
            {line}
          </Text>
        ))}
      </View>
      <View style={styles.buttonRow}>
        <PrimaryButton label="Done" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.large,
  },
  title: {
    fontSize: fontSizes.heading,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  lines: {
    gap: spacing.small,
  },
  line: {
    fontSize: fontSizes.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
