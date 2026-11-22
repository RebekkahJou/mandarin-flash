import { StyleSheet, Text } from 'react-native';

import { formatDuration } from '../../services/savedPracticeText';
import { ENGLISH_FONT_FAMILY, colors, fontSizes } from '../theme';

export function TimerDisplay({ elapsedMs }: { elapsedMs: number }) {
  const duration = formatDuration(elapsedMs);
  const accessibilityLabel = `Time ${duration}`;
  return (
    <Text style={styles.timer} accessibilityLabel={accessibilityLabel}>
      {duration}
    </Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
