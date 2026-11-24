import type { ColorValue } from 'react-native';

import { activeProfileBadge } from '../../domain/profileGroups';
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
  const badge = activeProfileBadge(profiles, activeProfile);
  if (!badge || showsWelcome) return {};
  const headerRight = ({ tintColor }: HeaderRightProps) => {
    const badgeColor = tintColor ?? colors.textPrimary;
    return <ProfileBadge name={badge.name} icon={badge.icon} color={badgeColor} />;
  };
  return { headerRight };
}
