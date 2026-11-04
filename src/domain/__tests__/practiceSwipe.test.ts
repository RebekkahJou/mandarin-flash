import { SWIPE_ANSWER_DISTANCE, SwipeAnswer, swipeAnswerFor } from '../practiceSwipe';

const far = SWIPE_ANSWER_DISTANCE;

describe('swipeAnswerFor', () => {
  it('maps left, right and down to missed, gotten and learned', () => {
    expect(swipeAnswerFor(-far, 0)).toBe(SwipeAnswer.Missed);
    expect(swipeAnswerFor(far, 0)).toBe(SwipeAnswer.Gotten);
    expect(swipeAnswerFor(0, far)).toBe(SwipeAnswer.Learned);
  });

  it('ignores swipes that are too short or go up', () => {
    expect(swipeAnswerFor(-(far - 1), 0)).toBeNull();
    expect(swipeAnswerFor(0, far - 1)).toBeNull();
    expect(swipeAnswerFor(0, -far * 2)).toBeNull();
  });

  it('uses the larger direction for diagonal swipes', () => {
    expect(swipeAnswerFor(far * 1.5, far)).toBe(SwipeAnswer.Gotten);
    expect(swipeAnswerFor(-far, far * 1.5)).toBe(SwipeAnswer.Learned);
  });
});
