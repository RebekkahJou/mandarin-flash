export enum FrequencyTier {
  HighIncidence = 'high_incidence',
  MemoryReinforcement = 'memory_reinforcement',
  Retention = 'retention',
}

/** Ordered from most to least frequent. */
export const FREQUENCY_TIERS_IN_ORDER: readonly FrequencyTier[] = [
  FrequencyTier.HighIncidence,
  FrequencyTier.MemoryReinforcement,
  FrequencyTier.Retention,
];

export const NEW_WORD_TIER = FrequencyTier.HighIncidence;

/** Share of a practice set drawn from each tier. */
export const PRACTICE_SET_TIER_RATIOS: Readonly<Record<FrequencyTier, number>> = {
  [FrequencyTier.HighIncidence]: 0.6,
  [FrequencyTier.MemoryReinforcement]: 0.3,
  [FrequencyTier.Retention]: 0.1,
};

/** Marking a word "learned" moves it one tier down; Retention is the floor. */
export function downgradeTier(currentTier: FrequencyTier): FrequencyTier {
  const currentIndex = FREQUENCY_TIERS_IN_ORDER.indexOf(currentTier);
  const lowestIndex = FREQUENCY_TIERS_IN_ORDER.length - 1;
  return FREQUENCY_TIERS_IN_ORDER[Math.min(currentIndex + 1, lowestIndex)];
}

export function isFrequencyTier(value: string): value is FrequencyTier {
  return (FREQUENCY_TIERS_IN_ORDER as readonly string[]).includes(value);
}
