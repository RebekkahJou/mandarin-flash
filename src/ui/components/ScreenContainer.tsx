import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

interface ScreenContainerProps {
  children: ReactNode;
  isScrollable?: boolean;
  /** Turned off while something on the screen is being dragged. */
  isScrollEnabled?: boolean;
}

const SAFE_AREA_EDGES: Edge[] = ['bottom', 'left', 'right'];

export function ScreenContainer({
  children,
  isScrollable = false,
  isScrollEnabled = true,
}: ScreenContainerProps) {
  const fixedContentStyle = [styles.content, styles.fill];
  const content = isScrollable ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={isScrollEnabled}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={fixedContentStyle}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.safeArea} edges={SAFE_AREA_EDGES}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.medium,
    gap: spacing.medium,
  },
  fill: {
    flex: 1,
  },
});
