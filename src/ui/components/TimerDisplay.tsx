import { StyleSheet, Text } from 'react-native';

import { ENGLISH_FONT_FAMILY, colors, fontSizes } from '../theme';

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / MILLISECONDS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function TimerDisplay({ elapsedMs }: { elapsedMs: number }) {
  return (
    <Text style={styles.timer} accessibilityLabel={`Time ${formatDuration(elapsedMs)}`}>
      {formatDuration(elapsedMs)}
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
