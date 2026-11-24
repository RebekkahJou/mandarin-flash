export const MAX_PROFILE_NAME_LENGTH = 30;

/**
 * Why a new profile name can't be used in a language, or null when it can. Names only need to be
 * unique within one language, so "Me" can learn both Traditional and Simplified. Names are
 * compared ignoring case.
 */
export function profileNameProblem(
  name: string,
  namesInLanguage: readonly string[],
): string | null {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return 'Enter a name.';
  if (trimmedName.length > MAX_PROFILE_NAME_LENGTH) {
    return `Names can be up to ${MAX_PROFILE_NAME_LENGTH} characters.`;
  }
  const lowerCaseName = trimmedName.toLowerCase();
  if (namesInLanguage.some((existing) => existing.toLowerCase() === lowerCaseName)) {
    return `There is already a profile called ${trimmedName} for this language.`;
  }
  return null;
}

/**
 * The names to create for one "add": the typed name (if any) followed by the copied names, each
 * once ignoring case.
 */
export function namesToCreate(typedName: string, copiedNames: readonly string[]): string[] {
  const names: string[] = [];
  const seenNames = new Set<string>();
  for (const name of [typedName, ...copiedNames].map((candidate) => candidate.trim())) {
    const lowerCaseName = name.toLowerCase();
    if (name.length === 0 || seenNames.has(lowerCaseName)) continue;
    seenNames.add(lowerCaseName);
    names.push(name);
  }
  return names;
}
