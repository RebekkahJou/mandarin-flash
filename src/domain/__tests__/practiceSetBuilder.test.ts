import { FrequencyTier } from '../frequencyTier';
import { buildPracticeSet, tierQuotas } from '../practiceSetBuilder';
import type { Word } from '../word';
import { makeWordsInTier, seededRandom } from './testWords';

function countByTier(words: readonly Word[]) {
  const countInTier = (tier: FrequencyTier) =>
    words.filter((word) => word.frequencyTier === tier).length;
  return {
    high: countInTier(FrequencyTier.HighIncidence),
    reinforcement: countInTier(FrequencyTier.MemoryReinforcement),
    retention: countInTier(FrequencyTier.Retention),
  };
}

describe('tierQuotas', () => {
  it.each([20, 40, 60, 80])('splits a set of %i into 60/30/10', (setSize) => {
    const quotas = tierQuotas(setSize);
    expect(quotas[FrequencyTier.HighIncidence]).toBe(setSize * 0.6);
    expect(quotas[FrequencyTier.MemoryReinforcement]).toBe(setSize * 0.3);
    expect(quotas[FrequencyTier.Retention]).toBe(setSize * 0.1);
  });

  it('gives rounding leftovers to High Incidence so the total is exact', () => {
    const quotas = tierQuotas(25);
    const total = Object.values(quotas).reduce((sum, quota) => sum + quota, 0);
    expect(total).toBe(25);
    expect(quotas[FrequencyTier.HighIncidence]).toBe(16);
  });
});

describe('buildPracticeSet', () => {
  const plentifulWords = [
    ...makeWordsInTier(100, FrequencyTier.HighIncidence, 0),
    ...makeWordsInTier(100, FrequencyTier.MemoryReinforcement, 1000),
    ...makeWordsInTier(100, FrequencyTier.Retention, 2000),
  ];

  it('draws 60/30/10 when every tier has enough words', () => {
    const practiceSet = buildPracticeSet(plentifulWords, 40, seededRandom(1));
    expect(practiceSet).toHaveLength(40);
    expect(countByTier(practiceSet)).toEqual({ high: 24, reinforcement: 12, retention: 4 });
  });

  it('never repeats a word', () => {
    const practiceSet = buildPracticeSet(plentifulWords, 80, seededRandom(2));
    expect(new Set(practiceSet.map((word) => word.id)).size).toBe(80);
  });

  it('backfills from other tiers when a tier runs short', () => {
    const words = [
      ...makeWordsInTier(100, FrequencyTier.HighIncidence, 0),
      ...makeWordsInTier(2, FrequencyTier.MemoryReinforcement, 1000),
    ];
    const practiceSet = buildPracticeSet(words, 40, seededRandom(3));
    expect(practiceSet).toHaveLength(40);
    expect(countByTier(practiceSet)).toEqual({ high: 38, reinforcement: 2, retention: 0 });
  });

  it('uses every word when the list is smaller than the set size', () => {
    const words = makeWordsInTier(7, FrequencyTier.Retention, 0);
    expect(buildPracticeSet(words, 20, seededRandom(4))).toHaveLength(7);
  });
});
