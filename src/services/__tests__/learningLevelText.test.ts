import { FrequencyTier } from '../../domain/frequencyTier';
import { LEARNING_LEVEL_LABELS, learningLevelShareNote } from '../learningLevelText';

describe('learning level text', () => {
  it('names levels by how often they come up in practice', () => {
    expect(LEARNING_LEVEL_LABELS[FrequencyTier.HighIncidence]).toBe('High practice');
    expect(LEARNING_LEVEL_LABELS[FrequencyTier.MemoryReinforcement]).toBe('Reinforcement');
  });

  it("explains each level's share of a practice set", () => {
    expect(learningLevelShareNote()).toBe(
      'High practice words make up 60% of each practice set, Reinforcement words 30% and ' +
        'Retention words 10%.',
    );
  });
});
