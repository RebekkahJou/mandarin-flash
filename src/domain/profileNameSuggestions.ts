/**
 * Playful, ungendered names suggested for new profiles: the first profile (usually the parent)
 * gets a ruler, later profiles a sidekick. Shown as the name box's placeholder and used when the
 * box is left empty.
 */
import type { RandomSource } from './random';

export const FIRST_PROFILE_NAME_SUGGESTIONS: readonly string[] = [
  'Ruler of All',
  'Loving Overlord',
  'Sovereign of the Phone',
  'Monarch of this Phonedom',
  'Household Hero',
  'Party Leader',
  'Dragon Tyrant',
];

export const OTHER_PROFILE_NAME_SUGGESTIONS: readonly string[] = [
  'Noble Offspring',
  'Underling',
  'Minion',
  'Beloved Lackey',
  'Royal Consort',
  'Secondary Hero',
  'Brave Adventurer',
  'Daring Swordmaster',
  'Apprentice Wizard',
  'Forest Spirit',
  'Bard Supreme',
  'Wild Wayfarer',
  'Henchfolk',
];

/**
 * A random suggestion nobody in the language uses yet (ignoring case); when every one is taken,
 * any of them, since the user can still type their own.
 */
export function pickProfileNameSuggestion(
  suggestions: readonly string[],
  takenNames: readonly string[],
  random: RandomSource,
): string {
  const taken = new Set(takenNames.map((name) => name.toLowerCase()));
  const available = suggestions.filter((name) => !taken.has(name.toLowerCase()));
  const choices = available.length > 0 ? available : suggestions;
  return choices[Math.floor(random() * choices.length)] ?? '';
}

/** What a new profile is called: the typed name, or the suggestion when nothing was typed. */
export function nameOrSuggestion(typedName: string, suggestion: string): string {
  return typedName.trim().length > 0 ? typedName : suggestion;
}
