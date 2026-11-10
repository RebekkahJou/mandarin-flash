import type { LanguageId } from './language';

export interface Profile {
  id: number;
  name: string;
  languageId: LanguageId;
  lastUsedAtMs: number;
}

export interface LanguageProfileGroup {
  languageId: LanguageId;
  /** Most recently used first. */
  profiles: Profile[];
}

function byMostRecentUse(first: Profile, second: Profile): number {
  return second.lastUsedAtMs - first.lastUsedAtMs || first.id - second.id;
}

/**
 * One group per language for the welcome screen's tabs. The most recently used language comes
 * first, so it is the one selected when the app opens.
 */
export function groupProfilesByLanguage(profiles: readonly Profile[]): LanguageProfileGroup[] {
  const groups = new Map<LanguageId, Profile[]>();
  for (const profile of [...profiles].sort(byMostRecentUse)) {
    groups.set(profile.languageId, [...(groups.get(profile.languageId) ?? []), profile]);
  }
  return [...groups].map(([languageId, groupProfiles]) => ({
    languageId,
    profiles: groupProfiles,
  }));
}

/** The first profile created. It can't be deleted, so there is always someone to practice as. */
export function isOriginalProfile(profile: Profile, profiles: readonly Profile[]): boolean {
  return profiles.every((other) => other.id >= profile.id);
}

/** Names already used in a language, other than this profile's own, for checking a new name. */
export function otherNamesInLanguage(
  profiles: readonly Profile[],
  languageId: LanguageId,
  exceptProfileId?: number,
): string[] {
  return profiles
    .filter((profile) => profile.languageId === languageId && profile.id !== exceptProfileId)
    .map((profile) => profile.name);
}

/**
 * Names that can be copied when adding a language: every other language's profile names, once
 * each (ignoring case), minus names the new language already has.
 */
export function profileNamesToCopy(
  profiles: readonly Profile[],
  targetLanguageId: LanguageId,
): string[] {
  const takenNames = new Set(
    profiles
      .filter((profile) => profile.languageId === targetLanguageId)
      .map((profile) => profile.name.toLowerCase()),
  );
  const names: string[] = [];
  for (const profile of [...profiles].sort(byMostRecentUse)) {
    const lowerCaseName = profile.name.toLowerCase();
    if (takenNames.has(lowerCaseName)) continue;
    takenNames.add(lowerCaseName);
    names.push(profile.name);
  }
  return names;
}
