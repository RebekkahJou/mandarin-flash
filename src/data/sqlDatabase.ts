export type SqlValue = string | number | null;
export type SqlParams = readonly SqlValue[];

export interface SqlRunResult {
  lastInsertRowId: number;
  changes: number;
}

/**
 * The only database surface repositories may use. The app wraps expo-sqlite;
 * tests wrap better-sqlite3, so repositories are verified against real SQLite in Node.
 */
export interface SqlDatabase {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlParams): Promise<SqlRunResult>;
  getAll<Row>(sql: string, params?: SqlParams): Promise<Row[]>;
  getFirst<Row>(sql: string, params?: SqlParams): Promise<Row | null>;
  transaction(task: () => Promise<void>): Promise<void>;
  close(): Promise<void>;
}
