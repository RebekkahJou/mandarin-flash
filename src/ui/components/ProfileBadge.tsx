import type { ColorValue } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { fontSizes, radii, spacing } from '../theme';

/** Long names are cut short so the screen title keeps most of the header. */
const MAXIMUM_BADGE_WIDTH = 140;

interface ProfileBadgeProps {
  name: string;
  /** The header's text color, so the badge reads on both the cerulean and cream headers. */
  color: ColorValue;
}

/** The active profile's name in a screen header, so it's clear whose words are showing. */
export function ProfileBadge({ name, color }: ProfileBadgeProps) {
  const accessibilityLabel = `Profile: ${name}`;
  const badgeStyle = [styles.badge, { borderColor: color }];
  const labelStyle = [styles.label, { color }];
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={badgeStyle}>
      <Text style={labelStyle} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    maxWidth: MAXIMUM_BADGE_WIDTH,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.extraSmall,
  },
  label: {
    fontSize: fontSizes.small,
    fontWeight: '600',
  },
});
