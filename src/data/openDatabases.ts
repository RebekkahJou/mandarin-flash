import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { importDatabaseFromAssetAsync, openDatabaseAsync } from 'expo-sqlite';

import { wrapExpoDatabase } from './expoSqlDatabase';
import { migrateUserDatabase } from './migrations/userDatabaseMigrations';
import type { SqlDatabase } from './sqlDatabase';

const USER_DATABASE_NAME = 'user.db';
const USER_DATABASE_KEY_NAME = 'userDatabaseKey';
const DATABASE_KEY_BYTES = 32;
const HEX_KEY_PATTERN = /^[0-9a-f]{64}$/;

/** Bump when the bundled dictionary changes so the new file replaces the old copy. */
const DICTIONARY_VERSION = 1;
const DICTIONARY_DATABASE_NAME = `dictionary-v${DICTIONARY_VERSION}.db`;

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

/** Copies the bundled read-only dictionary into app storage on first launch, then opens it. */
export async function openDictionaryDatabase(): Promise<SqlDatabase> {
  await importDatabaseFromAssetAsync(DICTIONARY_DATABASE_NAME, {
    assetId: require('../../assets/data/dictionary.db') as number,
  });
  const database = await openDatabaseAsync(DICTIONARY_DATABASE_NAME, {
    enableChangeListener: false,
  });
  await database.execAsync('PRAGMA query_only = ON');
  return wrapExpoDatabase(database);
}
