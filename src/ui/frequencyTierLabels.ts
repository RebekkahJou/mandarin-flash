import { FrequencyTier } from '../domain/frequencyTier';

export const FREQUENCY_TIER_LABELS: Readonly<Record<FrequencyTier, string>> = {
  [FrequencyTier.HighIncidence]: 'High incidence',
  [FrequencyTier.MemoryReinforcement]: 'Reinforcement',
  [FrequencyTier.Retention]: 'Retention',
};
