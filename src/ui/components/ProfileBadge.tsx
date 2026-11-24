import type { ColorValue } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { fontSizes, radii, spacing } from '../theme';

/** Long names are cut short so the screen title keeps most of the header. */
const MAXIMUM_BADGE_WIDTH = 140;

interface ProfileBadgeProps {
  name: string;
  /** An emoji shown before the name; undefined for none. */
  icon?: string;
  /** The header's text color, so the badge reads on both the cerulean and cream headers. */
  color: ColorValue;
}

/** The active profile's icon and name in a screen header, so it's clear whose words are showing. */
export function ProfileBadge({ name, icon, color }: ProfileBadgeProps) {
  const accessibilityLabel = `Profile: ${name}`;
  const text = icon ? `${icon} ${name}` : name;
  const badgeStyle = [styles.badge, { borderColor: color }];
  const labelStyle = [styles.label, { color }];
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={badgeStyle}>
      <Text style={labelStyle} numberOfLines={1}>
        {text}
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
