import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

interface GameHandoffProps {
  /** Where the game is, e.g. "Round 2 of 3". */
  stepLabel: string;
  /** Who plays next, e.g. "Pass the phone to Kid". */
  title: string;
  /** What just happened or what to do, e.g. "Me took 1:23." */
  note: string | null;
  startLabel: string;
  onStart: () => void;
}

/** Between turns: tells the players whose turn is next and waits for them to start. */
export function GameHandoff({ stepLabel, title, note, startLabel, onStart }: GameHandoffProps) {
  const noteText = note ? <Text style={styles.note}>{note}</Text> : null;
  return (
    <View style={styles.container}>
      <Text style={styles.step}>{stepLabel}</Text>
      <Text style={styles.title}>{title}</Text>
      {noteText}
      <View style={styles.buttonRow}>
        <PrimaryButton label={startLabel} onPress={onStart} isProminent />
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
  step: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  title: {
    fontSize: fontSizes.heading,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  note: {
    fontSize: fontSizes.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
