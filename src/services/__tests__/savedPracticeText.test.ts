import { formatDuration, practiceSavedSetLabel, savedSetTimesText } from '../savedPracticeText';

describe('saved practice text', () => {
  it('formats durations as minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(187_900)).toBe('3:07');
  });

  it('labels the saved set with its word count', () => {
    expect(practiceSavedSetLabel(20)).toBe('Practice saved set (20 words)');
  });

  it('lists the times newest first, or explains how to record one', () => {
    expect(savedSetTimesText([192_000, 178_000])).toBe(
      'Times to get every word, newest first: 3:12, 2:58',
    );
    expect(savedSetTimesText([])).toBe(
      'No times yet. Get every word in the saved set to record one.',
    );
  });
});
