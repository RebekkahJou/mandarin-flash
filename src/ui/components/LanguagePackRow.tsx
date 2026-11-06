import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../theme';
import { CompactButton } from './CompactButton';

interface LanguagePackRowProps {
  title: string;
  details: string;
  /** Shows a Remove button when given; built-in packs can't be removed. */
  onRemove?: () => void;
}

/** One language pack in the Language packs list. */
export function LanguagePackRow({ title, details, onRemove }: LanguagePackRowProps) {
  const removeButton = onRemove ? (
    <CompactButton label="Remove" onPress={onRemove} isOutlined />
  ) : null;
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.details}>{details}</Text>
      </View>
      {removeButton}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: spacing.medium,
  },
  text: {
    flex: 1,
    gap: spacing.extraSmall,
  },
  title: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  details: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
});
