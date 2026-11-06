import { useState } from 'react';

import type { LanguageId } from '../../domain/language';
import { LANGUAGE_DEFINITIONS } from '../../domain/language';
import { groupProfilesByLanguage } from '../../domain/profileGroups';
import { useProfileSession } from '../ProfileSessionContext';

/** Language tabs (most recently used first, and selected) and the chosen language's profiles. */
export function useWelcome() {
  const { profiles, selectProfile } = useProfileSession();
  const groups = groupProfilesByLanguage(profiles);
  const [chosenLanguageId, setChosenLanguageId] = useState<LanguageId | null>(null);
  const selectedGroup = groups.find((group) => group.languageId === chosenLanguageId) ?? groups[0];
  const languageTabs = groups.map((group) => ({
    value: group.languageId,
    label: LANGUAGE_DEFINITIONS[group.languageId].name,
  }));
  return {
    languageTabs,
    hasSeveralLanguages: groups.length > 1,
    selectedLanguageId: selectedGroup?.languageId,
    selectedLanguageName: selectedGroup ? LANGUAGE_DEFINITIONS[selectedGroup.languageId].name : '',
    profiles: selectedGroup?.profiles ?? [],
    selectLanguage: setChosenLanguageId,
    selectProfile,
  };
}
