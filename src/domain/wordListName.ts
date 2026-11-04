export const MAX_WORD_LIST_NAME_LENGTH = 40;

/** Why a new list name can't be used, or null when it can. Names are compared ignoring case. */
export function wordListNameProblem(name: string, existingNames: readonly string[]): string | null {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return 'Enter a name for the list.';
  if (trimmedName.length > MAX_WORD_LIST_NAME_LENGTH) {
    return `List names can be up to ${MAX_WORD_LIST_NAME_LENGTH} characters.`;
  }
  const lowerCaseName = trimmedName.toLowerCase();
  if (existingNames.some((existing) => existing.toLowerCase() === lowerCaseName)) {
    return `There is already a list called ${trimmedName}.`;
  }
  return null;
}
