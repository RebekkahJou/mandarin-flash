import { FrequencyTier, PRACTICE_SET_TIER_RATIOS } from '../domain/frequencyTier';

/**
 * What the app calls each frequency tier: how often a word comes up in practice, not how common
 * it is in everyday speech. Only the labels changed; stored values keep their old names.
 */
export const LEARNING_LEVEL_LABELS: Readonly<Record<FrequencyTier, string>> = {
  [FrequencyTier.HighIncidence]: 'High practice',
  [FrequencyTier.MemoryReinforcement]: 'Reinforcement',
  [FrequencyTier.Retention]: 'Retention',
};

const PERCENT = 100;

function levelShare(tier: FrequencyTier): string {
  return `${LEARNING_LEVEL_LABELS[tier]} words ${Math.round(PRACTICE_SET_TIER_RATIOS[tier] * PERCENT)}%`;
}

/** Built from PRACTICE_SET_TIER_RATIOS, so it stays true if the shares change. */
export function learningLevelShareNote(): string {
  const highPractice = levelShare(FrequencyTier.HighIncidence).replace(
    ' words ',
    ' words make up ',
  );
  const reinforcement = levelShare(FrequencyTier.MemoryReinforcement);
  const retention = levelShare(FrequencyTier.Retention);
  return `${highPractice} of each practice set, ${reinforcement} and ${retention}.`;
}
