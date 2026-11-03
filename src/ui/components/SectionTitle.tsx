import { StyleSheet, Text } from 'react-native';

import { colors, fontSizes } from '../theme';

export function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={styles.title} accessibilityRole="header">
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
