import type { FrequencyTier } from './frequencyTier';

/** A word or phrase the user is studying. One row per profile + headword + reading. */
export interface Word {
  id: number;
  profileId: number;
  /** The word as studied, e.g. Traditional characters for Mandarin (Traditional). */
  headword: string;
  /** Another written form (e.g. Simplified), present only when it differs from the headword. */
  variant?: string;
  /**
   * Normalized pronunciation, always stored; display is controlled by settings. For Mandarin it
   * is numbered-tone pinyin, e.g. "ni3 hao3".
   */
  reading: string;
  definitions: string[];
  frequencyTier: FrequencyTier;
}

/** A meaning candidate from the dictionary, with the parts of speech it was tagged with. */
export interface DefinitionCandidate {
  text: string;
  partsOfSpeech: readonly string[];
}

export const DEFAULT_MEANING_COUNT = 3;
