import { router } from 'expo-router';

import { LANGUAGE_DEFINITIONS } from '../../domain/language';
import { useProfileSession } from '../ProfileSessionContext';

/**
 * The Settings profile row. With one profile there is nobody to switch to, so the button adds a
 * new user instead.
 */
export function useProfileSwitcher() {
  const { profiles, activeProfile, chooseAnotherProfile } = useProfileSession();
  const hasSeveralProfiles = profiles.length > 1;
  const languageName = activeProfile ? LANGUAGE_DEFINITIONS[activeProfile.languageId].name : '';
  return {
    profileSummary: `${activeProfile?.name ?? ''} · ${languageName}`,
    buttonLabel: hasSeveralProfiles ? 'Switch profile' : 'Add a new user',
    onPress: hasSeveralProfiles ? chooseAnotherProfile : () => router.push('/profiles/add'),
  };
}
