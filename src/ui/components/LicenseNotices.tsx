import { StyleSheet, Text, View } from 'react-native';

import type { PackLicense } from '../../domain/packMetadata';
import { colors, fontSizes, radii, spacing } from '../theme';

interface LicenseNoticesProps {
  licenses: readonly PackLicense[];
}

/** Credits for bundled data, fonts or code: what each is used for, its license and source. */
export function LicenseNotices({ licenses }: LicenseNoticesProps) {
  return (
    <View style={styles.list}>
      {licenses.map((notice) => (
        <View key={notice.name} style={styles.notice}>
          <Text style={styles.name}>{notice.name}</Text>
          <Text style={styles.body}>{notice.usage}</Text>
          <Text style={styles.detail}>{notice.license}</Text>
          <Text style={styles.detail}>{notice.source}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.medium,
  },
  notice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: spacing.medium,
    gap: spacing.extraSmall,
  },
  name: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  detail: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
});
