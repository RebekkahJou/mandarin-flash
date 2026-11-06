/** Stored in review_events.answer, so never change an existing value. */
export enum ReviewAnswer {
  Missed = 'missed',
  Gotten = 'gotten',
  Learned = 'learned',
}

/** One practice answer, kept so progress and comparisons can be computed later. */
export interface ReviewEvent {
  profileId: number;
  wordId: number;
  answer: ReviewAnswer;
  answeredAtMs: number;
}

export function isReviewAnswer(value: string): value is ReviewAnswer {
  return (Object.values(ReviewAnswer) as string[]).includes(value);
}
