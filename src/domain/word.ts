import type { FrequencyTier } from './frequencyTier';

/** A word or phrase the user is studying. One row per profile + traditional + pinyin. */
export interface Word {
  id: number;
  profileId: number;
  traditional: string;
  /** Present only when it differs from the traditional form. */
  simplified?: string;
  /** Numbered-tone pinyin, e.g. "ni3 hao3". Always stored; display is controlled by settings. */
  pinyin: string;
  definitions: string[];
  frequencyTier: FrequencyTier;
}

/** A meaning candidate from the dictionary, with the parts of speech it was tagged with. */
export interface DefinitionCandidate {
  text: string;
  partsOfSpeech: readonly string[];
}

export const DEFAULT_MEANING_COUNT = 3;
