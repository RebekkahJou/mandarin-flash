import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../theme';
import { CompactButton } from './CompactButton';

interface LanguagePackRowProps {
  title: string;
  details: string;
  /** The row's button, e.g. Remove for an installed pack or Get for a store pack; none if null. */
  action?: LanguagePackRowAction | null;
}

export interface LanguagePackRowAction {
  label: string;
  onPress: () => void;
  /** Outlined for actions that take something away, such as Remove. */
  isOutlined: boolean;
}

/** One language pack in the Language packs list. */
export function LanguagePackRow({ title, details, action = null }: LanguagePackRowProps) {
  const actionButton = action ? (
    <CompactButton label={action.label} onPress={action.onPress} isOutlined={action.isOutlined} />
  ) : null;
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.details}>{details}</Text>
      </View>
      {actionButton}
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
