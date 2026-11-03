import { FrequencyTier, downgradeTier, isFrequencyTier } from '../frequencyTier';

describe('downgradeTier', () => {
  it('moves each tier one step toward Retention', () => {
    expect(downgradeTier(FrequencyTier.HighIncidence)).toBe(FrequencyTier.MemoryReinforcement);
    expect(downgradeTier(FrequencyTier.MemoryReinforcement)).toBe(FrequencyTier.Retention);
  });

  it('keeps Retention as the lowest tier', () => {
    expect(downgradeTier(FrequencyTier.Retention)).toBe(FrequencyTier.Retention);
  });
});

describe('isFrequencyTier', () => {
  it('accepts stored tier values and rejects others', () => {
    expect(isFrequencyTier('retention')).toBe(true);
    expect(isFrequencyTier('sometimes')).toBe(false);
  });
});
