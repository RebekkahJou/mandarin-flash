import type { ReviewEvent } from '../../domain/reviewEvent';
import type { SqlDatabase } from '../sqlDatabase';

export function createReviewEventRepository(database: SqlDatabase) {
  async function recordReviewEvent(event: ReviewEvent): Promise<void> {
    await database.run(
      'INSERT INTO review_events (profile_id, word_id, answer, answered_at) VALUES (?, ?, ?, ?)',
      [event.profileId, event.wordId, event.answer, event.answeredAtMs],
    );
  }

  return { recordReviewEvent };
}

export type ReviewEventRepository = ReturnType<typeof createReviewEventRepository>;
