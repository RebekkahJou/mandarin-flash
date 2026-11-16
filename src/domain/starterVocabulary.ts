import type { DefaultWordListDefinition } from './defaultWordLists';
import {
  PHRASES_LIST_NAME,
  SUGGESTED_WORD_LISTS,
  TIME_WORDS_LIST_NAME,
  defaultWordListsFor,
} from './defaultWordLists';
import { FrequencyTier } from './frequencyTier';
import type { PartOfSpeech } from './partOfSpeech';
import { isPartOfSpeech } from './partOfSpeech';

/**
 * Curated starter vocabulary: numbered sets of common words shipped in a language pack. A profile
 * adds them one set at a time; the next set unlocks once most of the latest one is learned.
 */

/** Starter words that aren't one part of speech but still have a list of their own. */
export enum StarterWordGroup {
  Phrase = 'phrase',
  TimeWord = 'time word',
}

/** Stored in the pack's starter_words.part_of_speech column. */
export type StarterWordType = PartOfSpeech | StarterWordGroup;

/** Share of the latest set's words that must be learned before the next set unlocks. */
export const STARTER_SET_UNLOCK_SHARE = 0.9;

export interface StarterSetProgress {
  setNumber: number;
  /** Words in the set, from the pack. */
  setSize: number;
  /** The profile's words from this set that have moved past High practice. */
  learnedCount: number;
}

export type NextStarterSet =
  | { setNumber: number; isUnlocked: true }
  | { setNumber: number; isUnlocked: false; learnedNeeded: number; latest: StarterSetProgress };

export function isStarterWordType(value: string): value is StarterWordType {
  return isPartOfSpeech(value) || (Object.values(StarterWordGroup) as string[]).includes(value);
}

/** "Learned" means the word moved down to the Reinforcement or Retention learning level. */
export function isStarterWordLearned(tier: FrequencyTier): boolean {
  return tier !== FrequencyTier.HighIncidence;
}

export function learnedNeededToUnlock(setSize: number): number {
  return Math.ceil(setSize * STARTER_SET_UNLOCK_SHARE);
}

/**
 * The set to offer next, or null once every set is added. Set 1 is always open; later sets open
 * when the latest added set is at least STARTER_SET_UNLOCK_SHARE learned.
 */
export function nextStarterSet(
  addedSets: readonly StarterSetProgress[],
  availableSetNumbers: readonly number[],
): NextStarterSet | null {
  const addedNumbers = new Set(addedSets.map((progress) => progress.setNumber));
  const nextNumber = availableSetNumbers.find((setNumber) => !addedNumbers.has(setNumber));
  if (nextNumber === undefined) return null;
  const latest = addedSets.reduce<StarterSetProgress | undefined>(
    (highest, progress) =>
      !highest || progress.setNumber > highest.setNumber ? progress : highest,
    undefined,
  );
  if (!latest) return { setNumber: nextNumber, isUnlocked: true };
  const learnedNeeded = learnedNeededToUnlock(latest.setSize);
  if (latest.learnedCount >= learnedNeeded) return { setNumber: nextNumber, isUnlocked: true };
  return { setNumber: nextNumber, isUnlocked: false, learnedNeeded, latest };
}

/** "measure word" → "Measure words", for a word type no language list covers yet. */
function pluralListName(wordType: string): string {
  return `${wordType.charAt(0).toUpperCase()}${wordType.slice(1)}s`;
}

/**
 * The list a starter word of this type goes into, besides General Vocabulary: the language's
 * default or suggested list for its part of speech, or Phrases / Time words.
 */
export function listForStarterWordType(
  wordType: StarterWordType,
  languageExtraLists: readonly DefaultWordListDefinition[],
): DefaultWordListDefinition {
  if (wordType === StarterWordGroup.Phrase) return { name: PHRASES_LIST_NAME };
  if (wordType === StarterWordGroup.TimeWord) return { name: TIME_WORDS_LIST_NAME };
  const candidates = [...defaultWordListsFor(languageExtraLists), ...SUGGESTED_WORD_LISTS];
  const matching = candidates.find((list) => list.partOfSpeech === wordType);
  return matching ?? { name: pluralListName(wordType), partOfSpeech: wordType };
}
