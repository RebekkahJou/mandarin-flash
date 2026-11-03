import { FREQUENCY_TIERS_IN_ORDER, FrequencyTier, PRACTICE_SET_TIER_RATIOS } from './frequencyTier';
import type { RandomSource } from './random';
import { shuffle } from './random';
import type { Word } from './word';

export const PRACTICE_SET_SIZES = [20, 40, 60, 80] as const;
export type PracticeSetSize = (typeof PRACTICE_SET_SIZES)[number];
export const DEFAULT_PRACTICE_SET_SIZE: PracticeSetSize = 40;

/** How many cards each tier contributes, summing exactly to setSize. */
export function tierQuotas(setSize: number): Record<FrequencyTier, number> {
  const quotas = {} as Record<FrequencyTier, number>;
  let assigned = 0;
  for (const tier of FREQUENCY_TIERS_IN_ORDER) {
    quotas[tier] = Math.floor(setSize * PRACTICE_SET_TIER_RATIOS[tier]);
    assigned += quotas[tier];
  }
  // Rounding leftovers go to the most frequent tier.
  quotas[FrequencyTier.HighIncidence] += setSize - assigned;
  return quotas;
}

/**
 * Draws a practice set using the 60/30/10 tier split. When a tier has too few
 * words, the shortfall is filled from the other tiers so the set stays full.
 * Expects distinct words.
 */
export function buildPracticeSet(
  words: readonly Word[],
  setSize: number,
  random: RandomSource = Math.random,
): Word[] {
  if (words.length <= setSize) {
    return shuffle(words, random);
  }
  const quotas = tierQuotas(setSize);
  const selected: Word[] = [];
  const leftovers: Word[] = [];
  for (const tier of FREQUENCY_TIERS_IN_ORDER) {
    const tierWords = shuffle(
      words.filter((word) => word.frequencyTier === tier),
      random,
    );
    selected.push(...tierWords.slice(0, quotas[tier]));
    leftovers.push(...tierWords.slice(quotas[tier]));
  }
  const shortfall = setSize - selected.length;
  selected.push(...leftovers.slice(0, shortfall));
  return shuffle(selected, random);
}
