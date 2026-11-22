import type { ColorValue } from 'react-native';

import { activeProfileBadgeName } from '../../domain/profileGroups';
import { ProfileBadge } from '../components/ProfileBadge';
import { useProfileSession } from '../ProfileSessionContext';
import { colors } from '../theme';

interface HeaderRightProps {
  tintColor?: ColorValue;
}

/** Header options that show the active profile's name, when there are several profiles. */
export function useProfileBadgeHeader() {
  const { profiles, activeProfile } = useProfileSession();
  const badgeName = activeProfileBadgeName(profiles, activeProfile);
  if (!badgeName) return {};
  const headerRight = ({ tintColor }: HeaderRightProps) => {
    const badgeColor = tintColor ?? colors.textPrimary;
    return <ProfileBadge name={badgeName} color={badgeColor} />;
  };
  return { headerRight };
}
