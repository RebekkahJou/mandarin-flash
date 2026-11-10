/**
 * @jest-environment node
 */
import { PackMetadataKey, PackRejectedError } from '../../domain/packMetadata';
import { PACK_SCHEMA_VERSION } from '../packSchema';
import { PACK_LIMITS, validatePackDatabase } from '../packValidation';
import type { SqlDatabase } from '../sqlDatabase';
import { createInMemoryDatabase } from '../testing/nodeSqlDatabase';
import { INSERT_PACK_ENTRY_SQL, TEST_PACK_METADATA, writeTestPack } from '../testing/testPack';

async function createValidPack(): Promise<SqlDatabase> {
  const database = createInMemoryDatabase();
  await writeTestPack(database);
  await database.run(INSERT_PACK_ENTRY_SQL, [
    '軟體',
    '软体',
    'ruan3 ti3',
    '',
    '[["software",1]]',
    -1,
  ]);
  await database.run('INSERT INTO sentences (text, english) VALUES (?, ?)', ['走！', 'Go!']);
  return database;
}

async function expectRejected(database: SqlDatabase, message?: string): Promise<void> {
  const validation = validatePackDatabase(database);
  await expect(validation).rejects.toThrow(PackRejectedError);
  if (message) await expect(validation).rejects.toThrow(message);
}

describe('validatePackDatabase', () => {
  it('accepts a well-formed pack and returns its metadata', async () => {
    expect(await validatePackDatabase(await createValidPack())).toEqual(TEST_PACK_METADATA);
  });

  it('rejects a database that is not a pack', async () => {
    const database = createInMemoryDatabase();
    await database.exec('CREATE TABLE notes (text TEXT)');
    await expectRejected(database, 'damaged');
  });

  it('rejects a pack with a view', async () => {
    const database = await createValidPack();
    await database.exec('CREATE VIEW everything AS SELECT * FROM entries');
    await expectRejected(database);
  });

  it('rejects a pack missing a column', async () => {
    const database = await createValidPack();
    await database.exec('ALTER TABLE sentences DROP COLUMN english');
    await expectRejected(database);
  });

  it('asks for an app update when the pack schema is newer', async () => {
    const database = await createValidPack();
    await database.run('UPDATE pack_metadata SET value = ? WHERE key = ?', [
      String(PACK_SCHEMA_VERSION + 1),
      PackMetadataKey.SchemaVersion,
    ]);
    await expectRejected(database, 'newer version of the app');
  });

  it('rejects values of the wrong type', async () => {
    const database = await createValidPack();
    await database.run(INSERT_PACK_ENTRY_SQL, ['走', '', 'zou3', '', '[]', 'first']);
    await expectRejected(database);
  });

  it('rejects text longer than the limits', async () => {
    const database = await createValidPack();
    const longHeadword = '字'.repeat(PACK_LIMITS.maxHeadwordLength + 1);
    await database.run(INSERT_PACK_ENTRY_SQL, [longHeadword, '', 'zi4', '', '[]', 0]);
    await expectRejected(database);
  });

  it('rejects file names that could reach outside the pack folder', async () => {
    const database = await createValidPack();
    await database.run('INSERT INTO pack_files (name, kind, data) VALUES (?, ?, ?)', [
      '../font.ttf',
      'font',
      new Uint8Array([1, 2, 3]),
    ]);
    await expectRejected(database);
  });

  it('rejects files stored as text instead of bytes', async () => {
    const database = await createValidPack();
    await database.run('INSERT INTO pack_files (name, kind, data) VALUES (?, ?, ?)', [
      'font.ttf',
      'font',
      'not bytes',
    ]);
    await expectRejected(database);
  });
});
