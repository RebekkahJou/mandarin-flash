/**
 * @jest-environment node
 */
import {
  USER_DATABASE_MIGRATIONS,
  migrateUserDatabase,
} from '../migrations/userDatabaseMigrations';
import type { SqlDatabase } from '../sqlDatabase';
import { createInMemoryDatabase } from '../testing/nodeSqlDatabase';

const CREATED_AT = 1_700_000_000_000;

/** Builds a database as an installed app at schema version 1 would have it, with data in it. */
async function createVersionOneDatabaseWithWords(): Promise<SqlDatabase> {
  const database = createInMemoryDatabase();
  await database.exec(USER_DATABASE_MIGRATIONS[0]);
  await database.exec('PRAGMA user_version = 1');
  await database.run('INSERT INTO profiles (id, name, created_at) VALUES (1, ?, ?)', [
    'Me',
    CREATED_AT,
  ]);
  await database.run(
    `INSERT INTO words (id, profile_id, traditional, simplified, pinyin, definitions, frequency_tier, created_at)
     VALUES (1, 1, '說', '说', 'shuo1', '["to speak"]', 'retention', ?)`,
    [CREATED_AT],
  );
  await database.run(
    `INSERT INTO word_lists (id, profile_id, name, kind, part_of_speech, sort_order)
     VALUES (1, 1, 'Verbs', 'part_of_speech', 'verb', 0)`,
  );
  await database.run(
    'INSERT INTO word_list_entries (word_list_id, word_id, added_at) VALUES (1, 1, ?)',
    [CREATED_AT],
  );
  return database;
}

async function migratedDatabase(): Promise<SqlDatabase> {
  const database = await createVersionOneDatabaseWithWords();
  await migrateUserDatabase(database);
  return database;
}

describe('migration to language-neutral words', () => {
  it('records the latest schema version', async () => {
    const database = await migratedDatabase();
    const versionRow = await database.getFirst<{ user_version: number }>('PRAGMA user_version');
    expect(versionRow?.user_version).toBe(USER_DATABASE_MIGRATIONS.length);
  });

  it('keeps existing words under the renamed columns', async () => {
    const database = await migratedDatabase();
    const word = await database.getFirst('SELECT * FROM words WHERE id = 1');
    expect(word).toMatchObject({
      headword: '說',
      variant: '说',
      reading: 'shuo1',
      definitions: '["to speak"]',
      frequency_tier: 'retention',
    });
    expect(word).not.toHaveProperty('traditional');
  });

  it('keeps list entries pointing at their words', async () => {
    const database = await migratedDatabase();
    const entry = await database.getFirst<{ headword: string }>(
      `SELECT words.headword FROM word_list_entries
       JOIN words ON words.id = word_list_entries.word_id WHERE word_list_entries.word_list_id = 1`,
    );
    expect(entry?.headword).toBe('說');
  });

  it('still allows a word only once per profile and reading', async () => {
    const database = await migratedDatabase();
    await expect(
      database.run(
        `INSERT INTO words (profile_id, headword, reading, definitions, frequency_tier, created_at)
         VALUES (1, '說', 'shuo1', '[]', 'retention', ?)`,
        [CREATED_AT],
      ),
    ).rejects.toThrow(/UNIQUE/);
  });

  it('gives existing and new profiles Mandarin (Traditional)', async () => {
    const database = await migratedDatabase();
    await database.run('INSERT INTO profiles (name, created_at) VALUES (?, ?)', [
      'Kid',
      CREATED_AT,
    ]);
    const profiles = await database.getAll<{ language_id: string }>(
      'SELECT language_id FROM profiles ORDER BY id',
    );
    expect(profiles.map((profile) => profile.language_id)).toEqual(['zh-Hant', 'zh-Hant']);
  });
});

describe('migration adding last-used times', () => {
  it('starts existing profiles at their creation time', async () => {
    const database = await migratedDatabase();
    const profile = await database.getFirst<{ last_used_at: number }>(
      'SELECT last_used_at FROM profiles WHERE id = 1',
    );
    expect(profile?.last_used_at).toBe(CREATED_AT);
  });
});

describe('review_events', () => {
  async function databaseWithOneReview(): Promise<SqlDatabase> {
    const database = await migratedDatabase();
    await database.run(
      'INSERT INTO review_events (profile_id, word_id, answer, answered_at) VALUES (1, 1, ?, ?)',
      ['gotten', CREATED_AT],
    );
    return database;
  }

  async function reviewCount(database: SqlDatabase): Promise<number> {
    const row = await database.getFirst<{ count: number }>(
      'SELECT COUNT(*) AS count FROM review_events',
    );
    return row?.count ?? 0;
  }

  it('deletes a word’s history along with the word', async () => {
    const database = await databaseWithOneReview();
    await database.run('DELETE FROM words WHERE id = 1');
    expect(await reviewCount(database)).toBe(0);
  });

  it('deletes a profile’s history along with the profile', async () => {
    const database = await databaseWithOneReview();
    await database.run('DELETE FROM profiles WHERE id = 1');
    expect(await reviewCount(database)).toBe(0);
  });

  it('rejects an event for a word that does not exist', async () => {
    const database = await migratedDatabase();
    await expect(
      database.run(
        'INSERT INTO review_events (profile_id, word_id, answer, answered_at) VALUES (1, 99, ?, ?)',
        ['missed', CREATED_AT],
      ),
    ).rejects.toThrow(/FOREIGN KEY/);
  });
});

describe('migration adding starter sets', () => {
  it('leaves existing words outside any starter set', async () => {
    const database = await migratedDatabase();
    const row = await database.getFirst<{ starter_set: number | null }>(
      'SELECT starter_set FROM words WHERE id = 1',
    );
    expect(row?.starter_set).toBeNull();
  });
});
