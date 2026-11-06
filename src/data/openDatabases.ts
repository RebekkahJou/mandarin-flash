import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { deleteDatabaseAsync, importDatabaseFromAssetAsync, openDatabaseAsync } from 'expo-sqlite';

import type { PackMetadata } from '../domain/packMetadata';
import { wrapExpoDatabase } from './expoSqlDatabase';
import { migrateUserDatabase } from './migrations/userDatabaseMigrations';
import { readPackMetadata } from './packValidation';
import type { SqlDatabase } from './sqlDatabase';

const USER_DATABASE_NAME = 'user.db';
const USER_DATABASE_KEY_NAME = 'userDatabaseKey';
const DATABASE_KEY_BYTES = 32;
const HEX_KEY_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Bump when the built-in Mandarin pack (assets/data/mandarin-pack.db) changes so the new file
 * replaces the old copy. Versions 1–3 were the dictionary before it became a pack.
 */
const BUILT_IN_PACK_COPY_VERSION = 4;
const FIRST_BUILT_IN_PACK_COPY_VERSION = 1;

function builtInPackDatabaseName(version: number): string {
  return `dictionary-v${version}.db`;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** A random 256-bit key, created once and kept only in the Android Keystore-backed SecureStore. */
async function loadOrCreateDatabaseKey(): Promise<string> {
  const existingKey = await SecureStore.getItemAsync(USER_DATABASE_KEY_NAME);
  if (existingKey && HEX_KEY_PATTERN.test(existingKey)) return existingKey;
  const newKey = toHex(await Crypto.getRandomBytesAsync(DATABASE_KEY_BYTES));
  await SecureStore.setItemAsync(USER_DATABASE_KEY_NAME, newKey, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return newKey;
}

/** Opens the SQLCipher-encrypted user database and brings its schema up to date. */
export async function openUserDatabase(): Promise<SqlDatabase> {
  const key = await loadOrCreateDatabaseKey();
  const database = await openDatabaseAsync(USER_DATABASE_NAME);
  // A raw hex key skips SQLCipher's password-stretching step; it is already random.
  // Safe to interpolate: HEX_KEY_PATTERN guarantees only hex digits. PRAGMA can't take parameters.
  await database.execAsync(`PRAGMA key = "x'${key}'"`);
  const cipher = await database.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
  if (!cipher) {
    // Without SQLCipher, PRAGMA key silently does nothing; refuse to store data unencrypted.
    throw new Error('SQLCipher is not available, so the database would not be encrypted.');
  }
  const wrapped = wrapExpoDatabase(database);
  await migrateUserDatabase(wrapped);
  return wrapped;
}

/** Removes copies left by earlier app versions; each one is a whole dictionary (about 15 MB). */
async function deleteOlderBuiltInPacks(): Promise<void> {
  for (
    let version = FIRST_BUILT_IN_PACK_COPY_VERSION;
    version < BUILT_IN_PACK_COPY_VERSION;
    version++
  ) {
    // Deleting a copy that was never made throws; there is nothing to clean up then.
    await deleteDatabaseAsync(builtInPackDatabaseName(version)).catch(() => undefined);
  }
}

/** Opens a pack read-only. */
export async function openPackDatabase(
  databaseName: string,
  directory?: string,
): Promise<SqlDatabase> {
  const database = await openDatabaseAsync(
    databaseName,
    { enableChangeListener: false },
    directory,
  );
  await database.execAsync('PRAGMA query_only = ON');
  return wrapExpoDatabase(database);
}

/**
 * Copies the built-in Mandarin pack into app storage on first launch, then opens it. It ships
 * inside the app, so it is trusted and only its metadata is read.
 */
export async function openBuiltInPack(): Promise<{
  metadata: PackMetadata;
  database: SqlDatabase;
}> {
  const databaseName = builtInPackDatabaseName(BUILT_IN_PACK_COPY_VERSION);
  await importDatabaseFromAssetAsync(databaseName, {
    assetId: require('../../assets/data/mandarin-pack.db') as number,
  });
  await deleteOlderBuiltInPacks();
  const database = await openPackDatabase(databaseName);
  return { metadata: await readPackMetadata(database), database };
}
