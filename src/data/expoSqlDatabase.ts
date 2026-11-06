import type { SQLiteDatabase } from 'expo-sqlite';

import type { SqlDatabase, SqlParams, SqlRunResult } from './sqlDatabase';

export function wrapExpoDatabase(database: SQLiteDatabase): SqlDatabase {
  return {
    exec: (sql: string) => database.execAsync(sql),
    run: async (sql: string, params: SqlParams = []): Promise<SqlRunResult> => {
      const result = await database.runAsync(sql, [...params]);
      return { lastInsertRowId: result.lastInsertRowId, changes: result.changes };
    },
    getAll: <Row>(sql: string, params: SqlParams = []) =>
      database.getAllAsync<Row>(sql, [...params]),
    getFirst: <Row>(sql: string, params: SqlParams = []) =>
      database.getFirstAsync<Row>(sql, [...params]),
    transaction: (task: () => Promise<void>) => database.withTransactionAsync(task),
    close: () => database.closeAsync(),
  };
}
