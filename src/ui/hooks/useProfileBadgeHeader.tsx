import type { ColorValue } from 'react-native';

import { activeProfileBadgeName } from '../../domain/profileGroups';
import { ProfileBadge } from '../components/ProfileBadge';
import { useProfileSession } from '../ProfileSessionContext';
import { colors } from '../theme';

interface HeaderRightProps {
  tintColor?: ColorValue;
}

/**
 * Header options that show the active profile's name, when there are several profiles. Hidden
 * while the welcome screen asks who is practicing, since the last profile is still active then.
 */
export function useProfileBadgeHeader() {
  const { profiles, activeProfile, showsWelcome } = useProfileSession();
  const badgeName = activeProfileBadgeName(profiles, activeProfile);
  if (!badgeName || showsWelcome) return {};
  const headerRight = ({ tintColor }: HeaderRightProps) => {
    const badgeColor = tintColor ?? colors.textPrimary;
    return <ProfileBadge name={badgeName} color={badgeColor} />;
  };
  return { headerRight };
}
