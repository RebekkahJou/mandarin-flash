import type { SqlDatabase } from '../sqlDatabase';

/**
 * Each migration runs once, in order; PRAGMA user_version records how many have run.
 * Never edit a released migration — append a new one.
 */
const USER_DATABASE_MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE profiles (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  -- One row per word per profile. frequency_tier lives here (not on list entries)
  -- so marking a word learned in one list changes it in every list.
  CREATE TABLE words (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    traditional TEXT NOT NULL,
    simplified TEXT,
    pinyin TEXT NOT NULL,
    definitions TEXT NOT NULL,
    frequency_tier TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE (profile_id, traditional, pinyin)
  );

  CREATE TABLE word_lists (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    part_of_speech TEXT,
    sort_order INTEGER NOT NULL
  );

  -- Duplicates are allowed on purpose: the spec lets users add a word to a list twice.
  CREATE TABLE word_list_entries (
    id INTEGER PRIMARY KEY,
    word_list_id INTEGER NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    definitions_override TEXT,
    added_at INTEGER NOT NULL
  );
  CREATE INDEX word_list_entries_by_list ON word_list_entries(word_list_id);
  CREATE INDEX word_list_entries_by_word ON word_list_entries(word_id);

  CREATE TABLE practice_sessions (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    word_list_id INTEGER REFERENCES word_lists(id) ON DELETE SET NULL,
    set_size INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    total_elapsed_ms INTEGER NOT NULL,
    deck_completed_ms INTEGER
  );

  CREATE TABLE settings (
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (profile_id, key)
  );
  `,
];

export async function migrateUserDatabase(database: SqlDatabase): Promise<void> {
  await database.exec('PRAGMA foreign_keys = ON');
  const versionRow = await database.getFirst<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;
  for (let version = currentVersion; version < USER_DATABASE_MIGRATIONS.length; version++) {
    await database.transaction(async () => {
      await database.exec(USER_DATABASE_MIGRATIONS[version]);
      // PRAGMA can't take bound parameters; the value is a trusted loop counter.
      await database.exec(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
