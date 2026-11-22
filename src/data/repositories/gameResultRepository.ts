import { GameKind, GameWinner } from '../../domain/gamePlayers';
import type { GameResult } from '../../domain/gameResult';
import type { SqlDatabase } from '../sqlDatabase';

interface GameResultRow {
  game: string;
  first_profile_id: number;
  second_profile_id: number;
  options: string;
  first_score: number;
  second_score: number;
  winner: string;
  played_at: number;
}

function parseOptions(stored: string): GameResult['options'] {
  try {
    const parsed: unknown = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? (parsed as GameResult['options']) : {};
  } catch {
    return {};
  }
}

/** Null for a row with an unknown game or winner, so a bad row can never break the list. */
function toGameResult(row: GameResultRow): GameResult | null {
  const game = Object.values(GameKind).find((kind) => kind === row.game);
  const winner = Object.values(GameWinner).find((value) => value === row.winner);
  if (!game || !winner) return null;
  return {
    game,
    firstProfileId: row.first_profile_id,
    secondProfileId: row.second_profile_id,
    options: parseOptions(row.options),
    firstScore: row.first_score,
    secondScore: row.second_score,
    winner,
    playedAtMs: row.played_at,
  };
}

export function createGameResultRepository(database: SqlDatabase) {
  async function saveGameResult(result: GameResult): Promise<void> {
    await database.run(
      `INSERT INTO game_results (game, first_profile_id, second_profile_id, options, first_score,
         second_score, winner, played_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.game,
        result.firstProfileId,
        result.secondProfileId,
        JSON.stringify(result.options),
        result.firstScore,
        result.secondScore,
        result.winner,
        result.playedAtMs,
      ],
    );
  }

  /** Games the profile played as either player, newest first. */
  async function listRecentGameResults(profileId: number, limit: number): Promise<GameResult[]> {
    const rows = await database.getAll<GameResultRow>(
      `SELECT game, first_profile_id, second_profile_id, options, first_score, second_score,
         winner, played_at
       FROM game_results WHERE first_profile_id = ? OR second_profile_id = ?
       ORDER BY played_at DESC, id DESC LIMIT ?`,
      [profileId, profileId, limit],
    );
    return rows.map(toGameResult).filter((result) => result !== null);
  }

  return { saveGameResult, listRecentGameResults };
}

export type GameResultRepository = ReturnType<typeof createGameResultRepository>;
