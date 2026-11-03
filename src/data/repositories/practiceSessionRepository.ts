import type { SessionTimes } from '../../domain/sessionTimer';
import type { SqlDatabase } from '../sqlDatabase';

export interface CompletedPracticeSession extends SessionTimes {
  profileId: number;
  wordListId: number;
  setSize: number;
}

export function createPracticeSessionRepository(database: SqlDatabase) {
  async function saveCompletedSession(session: CompletedPracticeSession): Promise<void> {
    await database.run(
      `INSERT INTO practice_sessions
         (profile_id, word_list_id, set_size, started_at, total_elapsed_ms, deck_completed_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        session.profileId,
        session.wordListId,
        session.setSize,
        session.startedAtMs,
        session.totalElapsedMs,
        session.deckCompletedMs ?? null,
      ],
    );
  }

  return { saveCompletedSession };
}

export type PracticeSessionRepository = ReturnType<typeof createPracticeSessionRepository>;
