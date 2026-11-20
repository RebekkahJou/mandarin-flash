import type { PausedPracticeState } from '../../domain/pausedPracticeSet';
import { parsePausedState, serializePausedState } from '../../domain/pausedPracticeSet';
import type { SessionTimes } from '../../domain/sessionTimer';
import type { SqlDatabase } from '../sqlDatabase';

export interface CompletedPracticeSession extends SessionTimes {
  profileId: number;
  wordListId: number;
  setSize: number;
}

export interface PausedPracticeSet {
  wordListId: number;
  /** The cards per set chosen when the set started. */
  setSize: number;
  state: PausedPracticeState;
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

  /** Keeps one paused set per list; pausing again replaces it. */
  async function savePausedSet(profileId: number, pausedSet: PausedPracticeSet): Promise<void> {
    await database.run(
      `INSERT INTO paused_practice_sets (word_list_id, profile_id, set_size, state, paused_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (word_list_id) DO UPDATE SET
         set_size = excluded.set_size, state = excluded.state, paused_at = excluded.paused_at`,
      [
        pausedSet.wordListId,
        profileId,
        pausedSet.setSize,
        serializePausedState(pausedSet.state),
        Date.now(),
      ],
    );
  }

  /** The profile's paused sets, one per list at most; unreadable rows are left out. */
  async function listPausedSets(profileId: number): Promise<PausedPracticeSet[]> {
    const rows = await database.getAll<{ word_list_id: number; set_size: number; state: string }>(
      'SELECT word_list_id, set_size, state FROM paused_practice_sets WHERE profile_id = ?',
      [profileId],
    );
    return rows.flatMap((row) => {
      const state = parsePausedState(row.state);
      return state ? [{ wordListId: row.word_list_id, setSize: row.set_size, state }] : [];
    });
  }

  async function loadPausedSet(wordListId: number): Promise<PausedPracticeSet | null> {
    const row = await database.getFirst<{ set_size: number; state: string }>(
      'SELECT set_size, state FROM paused_practice_sets WHERE word_list_id = ?',
      [wordListId],
    );
    const state = row ? parsePausedState(row.state) : null;
    return row && state ? { wordListId, setSize: row.set_size, state } : null;
  }

  async function deletePausedSet(wordListId: number): Promise<void> {
    await database.run('DELETE FROM paused_practice_sets WHERE word_list_id = ?', [wordListId]);
  }

  return { saveCompletedSession, savePausedSet, listPausedSets, loadPausedSet, deletePausedSet };
}

export type PracticeSessionRepository = ReturnType<typeof createPracticeSessionRepository>;
