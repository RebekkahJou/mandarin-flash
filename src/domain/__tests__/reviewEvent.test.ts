import { ReviewAnswer, isReviewAnswer } from '../reviewEvent';

describe('isReviewAnswer', () => {
  it('accepts every stored answer value', () => {
    Object.values(ReviewAnswer).forEach((answer) => expect(isReviewAnswer(answer)).toBe(true));
  });

  it('rejects unknown values', () => {
    expect(isReviewAnswer('skipped')).toBe(false);
    expect(isReviewAnswer('')).toBe(false);
  });
});
