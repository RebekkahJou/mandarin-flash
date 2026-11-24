import { useState } from 'react';

import type { LanguageId } from '../../domain/language';
import { DEFAULT_LANGUAGE_ID, LANGUAGE_DEFINITIONS } from '../../domain/language';
import type { Profile } from '../../domain/profileGroups';
import { otherNamesInLanguage, profileNamesToCopy } from '../../domain/profileGroups';
import { namesToCreate, profileNameProblem } from '../../domain/profileName';
import { nameOrSuggestion, pickProfileNameSuggestion } from '../../domain/profileNameSuggestions';
import { showMessage } from '../confirm';
import { useProfileSession } from '../ProfileSessionContext';

export const LANGUAGE_CHOICES = Object.values(LANGUAGE_DEFINITIONS).map((definition) => ({
  value: definition.id,
  label: definition.name,
}));

function toggled(names: ReadonlySet<string>, name: string): Set<string> {
  const next = new Set(names);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  return next;
}

/** The first problem with the names about to be created, or null when they can all be added. */
function namesProblem(
  names: readonly string[],
  profiles: readonly Profile[],
  languageId: LanguageId,
) {
  if (names.length === 0) return 'Enter a name.';
  const namesInLanguage = otherNamesInLanguage(profiles, languageId);
  for (const name of names) {
    const problem = profileNameProblem(name, namesInLanguage);
    if (problem) return problem;
  }
  return null;
}

/**
 * State for creating profiles: a language, a typed name (or a playful suggested one, used when
 * nothing is typed) and, when the language has no profiles yet, other languages' profile names
 * to copy.
 */
export function useNewProfileForm(nameSuggestions: readonly string[]) {
  const { profiles, addProfiles } = useProfileSession();
  const [languageId, setLanguageId] = useState<LanguageId>(DEFAULT_LANGUAGE_ID);
  const [name, setName] = useState('');
  // Picked once, so the placeholder doesn't change while the user is on the screen.
  const [suggestedName] = useState(() =>
    pickProfileNameSuggestion(
      nameSuggestions,
      profiles.map((profile) => profile.name),
      Math.random,
    ),
  );
  const [copiedNames, setCopiedNames] = useState<ReadonlySet<string>>(new Set());

  const isNewLanguage = !profiles.some((profile) => profile.languageId === languageId);
  const copyableNames = isNewLanguage ? profileNamesToCopy(profiles, languageId) : [];

  const selectLanguage = (newLanguageId: LanguageId) => {
    setLanguageId(newLanguageId);
    setCopiedNames(new Set());
  };

  /** Creates the profiles, or explains why it can't and returns an empty list. */
  const submit = async (): Promise<Profile[]> => {
    const names = namesToCreate(nameOrSuggestion(name, suggestedName), [...copiedNames]);
    const problem = namesProblem(names, profiles, languageId);
    if (problem) {
      showMessage('Check the name', problem);
      return [];
    }
    return addProfiles(names, languageId);
  };

  return {
    languageId,
    selectLanguage,
    name,
    setName,
    suggestedName,
    copyableNames,
    copiedNames,
    toggleCopiedName: (copiedName: string) => setCopiedNames(toggled(copiedNames, copiedName)),
    submit,
  };
}
