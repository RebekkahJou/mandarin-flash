import Database from 'better-sqlite3';

import type { SqlDatabase, SqlParams } from '../sqlDatabase';

/** In-memory SQLite for repository tests. Not bundled into the app. */
export function createInMemoryDatabase(): SqlDatabase {
  const database = new Database(':memory:');
  database.pragma('foreign_keys = ON');
  return {
    exec: async (sql: string) => {
      database.exec(sql);
    },
    run: async (sql: string, params: SqlParams = []) => {
      const result = database.prepare(sql).run(...params);
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: result.changes };
    },
    getAll: async <Row>(sql: string, params: SqlParams = []) =>
      database.prepare(sql).all(...params) as Row[],
    getFirst: async <Row>(sql: string, params: SqlParams = []) =>
      (database.prepare(sql).get(...params) as Row | undefined) ?? null,
    transaction: async (task: () => Promise<void>) => {
      database.exec('BEGIN');
      try {
        await task();
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
