export enum SwipeAnswer {
  Missed = 'missed',
  Gotten = 'gotten',
  Learned = 'learned',
}

/** How far (in dp) a card must be swiped to count as an answer; shorter swipes spring back. */
export const SWIPE_ANSWER_DISTANCE = 80;

/**
 * Left is missed, right is gotten and down is learned (its frequency goes down). The larger
 * direction wins, so a slightly diagonal swipe still counts. Swiping up does nothing.
 */
export function swipeAnswerFor(dragX: number, dragY: number): SwipeAnswer | null {
  const isHorizontal = Math.abs(dragX) >= Math.abs(dragY);
  if (isHorizontal) {
    if (dragX <= -SWIPE_ANSWER_DISTANCE) return SwipeAnswer.Missed;
    if (dragX >= SWIPE_ANSWER_DISTANCE) return SwipeAnswer.Gotten;
    return null;
  }
  return dragY >= SWIPE_ANSWER_DISTANCE ? SwipeAnswer.Learned : null;
}
