import { formatWordCount } from '../wordCount';

describe('formatWordCount', () => {
  it('uses the singular only for one', () => {
    expect(formatWordCount(0)).toBe('0 words');
    expect(formatWordCount(1)).toBe('1 word');
    expect(formatWordCount(7)).toBe('7 words');
  });
});
