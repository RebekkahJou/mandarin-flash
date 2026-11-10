import { router } from 'expo-router';
import { useState } from 'react';

import { LANGUAGE_DEFINITIONS } from '../../domain/language';
import { isOriginalProfile, otherNamesInLanguage } from '../../domain/profileGroups';
import { profileNameProblem } from '../../domain/profileName';
import { confirm, showMessage } from '../confirm';
import { useProfileSession } from '../ProfileSessionContext';

/** Renames or deletes the active profile. The original profile can be renamed but not deleted. */
export function useEditProfile() {
  const { profiles, activeProfile, renameProfile, deleteProfile } = useProfileSession();
  const [name, setName] = useState(activeProfile?.name ?? '');
  const canDelete = activeProfile !== null && !isOriginalProfile(activeProfile, profiles);
  const languageName = activeProfile ? LANGUAGE_DEFINITIONS[activeProfile.languageId].name : '';

  const save = async () => {
    if (!activeProfile) return;
    const namesInLanguage = otherNamesInLanguage(
      profiles,
      activeProfile.languageId,
      activeProfile.id,
    );
    const problem = profileNameProblem(name, namesInLanguage);
    if (problem) {
      showMessage('Check the name', problem);
      return;
    }
    await renameProfile(activeProfile.id, name.trim());
    router.back();
  };

  const remove = async () => {
    if (!activeProfile) return;
    const isConfirmed = await confirm(
      `Delete ${activeProfile.name}?`,
      `This deletes ${activeProfile.name}'s word lists, words and practice history. It can't be undone.`,
      'Delete',
    );
    if (!isConfirmed) return;
    // Leave this screen first; the profile's screens close once it is gone.
    router.back();
    await deleteProfile(activeProfile.id);
  };

  return { name, setName, languageName, canDelete, save, remove };
}
