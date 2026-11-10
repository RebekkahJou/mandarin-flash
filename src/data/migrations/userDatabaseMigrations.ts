import type { SqlDatabase } from '../sqlDatabase';

/**
 * Each migration runs once, in order; PRAGMA user_version records how many have run.
 * Never edit a released migration — append a new one.
 */
export const USER_DATABASE_MIGRATIONS: readonly string[] = [
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
  // Language-neutral words, so other languages fit the same table. The UNIQUE constraint
  // follows the renamed columns. The default language is written out, not imported, because a
  // released migration must never change.
  `
  ALTER TABLE words RENAME COLUMN traditional TO headword;
  ALTER TABLE words RENAME COLUMN simplified TO variant;
  ALTER TABLE words RENAME COLUMN pinyin TO reading;

  ALTER TABLE profiles ADD COLUMN language_id TEXT NOT NULL DEFAULT 'zh-Hant';

  -- One row per practice answer. Kept from the start because history can't be rebuilt later.
  CREATE TABLE review_events (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    answered_at INTEGER NOT NULL
  );
  CREATE INDEX review_events_by_profile ON review_events(profile_id, answered_at);
  CREATE INDEX review_events_by_word ON review_events(word_id);
  `,
  // The welcome screen opens on the most recently used language and profile.
  `
  ALTER TABLE profiles ADD COLUMN last_used_at INTEGER NOT NULL DEFAULT 0;
  UPDATE profiles SET last_used_at = created_at;
  `,
  // Language packs the user installed. The pack files themselves sit outside this database; the
  // list lives here because which languages someone studies is personal.
  `
  CREATE TABLE installed_packs (
    pack_id TEXT PRIMARY KEY,
    pack_version INTEGER NOT NULL,
    database_name TEXT NOT NULL,
    installed_at INTEGER NOT NULL
  );
  `,
  // Which starter set a word came from (or counts toward), for starter set progress.
  `
  ALTER TABLE words ADD COLUMN starter_set INTEGER;
  CREATE INDEX words_by_starter_set ON words(profile_id, starter_set) WHERE starter_set IS NOT NULL;
  `,
  // Characters studied on their own that make up a compound (雜貨店 → 雜, 貨, 店), so a card can
  // show its breakdown. position is where the character first appears in the compound.
  `
  CREATE TABLE word_parts (
    compound_word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    part_word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    PRIMARY KEY (compound_word_id, position)
  );
  CREATE INDEX word_parts_by_part ON word_parts(part_word_id);
  `,
  // When a list filled from the language pack (Components) was filled, so emptying it later
  // doesn't fill it again.
  `
  ALTER TABLE word_lists ADD COLUMN filled_at INTEGER;
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
