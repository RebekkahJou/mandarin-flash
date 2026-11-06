import type { FileHandle } from 'expo-file-system';
import { Directory, File, FileMode } from 'expo-file-system';
import { defaultDatabaseDirectory } from 'expo-sqlite';

import { PackRejectedError } from '../domain/packMetadata';
import type { PackFileStore } from '../services/packs/packInstaller';
import { hexToBytes } from '../services/packs/packSignature';
import { openPackDatabase } from './openDatabases';

/** Installed pack databases sit next to the built-in pack, in expo-sqlite's own folder. */
const PACK_DATABASE_PREFIX = 'pack-';
const PACK_DATABASE_EXTENSION = '.db';
/** Starts with the prefix, so a copy left by an interrupted install is cleaned up at start. */
const STAGED_DATABASE_NAME = `${PACK_DATABASE_PREFIX}staging${PACK_DATABASE_EXTENSION}`;
const COPY_CHUNK_BYTES = 1024 * 1024;

const TOO_LARGE_MESSAGE = 'This file is too large to be a language pack.';
const NOT_A_PACK_MESSAGE = 'This file is not a language pack.';

function databaseDirectory(): Directory {
  return new Directory(`file://${defaultDatabaseDirectory as string}`);
}

function databaseFile(databaseName: string): File {
  return new File(databaseDirectory(), databaseName);
}

function deleteIfPresent(file: File): void {
  if (file.exists) file.delete();
}

/** Copies everything after the header in chunks, so a large pack never sits in memory whole. */
async function copyRest(input: FileHandle, output: FileHandle, maxBytes: number): Promise<void> {
  let copiedBytes = 0;
  for (;;) {
    const chunk = await input.readBytes(COPY_CHUNK_BYTES);
    if (chunk.length === 0) return;
    copiedBytes += chunk.length;
    if (copiedBytes > maxBytes) throw new PackRejectedError(TOO_LARGE_MESSAGE);
    await output.writeBytes(chunk);
  }
}

/** Pack files on the phone. The source may be a content:// URI from another app. */
export function createExpoPackFileStore(): PackFileStore {
  const stagedFile = () => databaseFile(STAGED_DATABASE_NAME);

  async function stagePackFile(sourceUri: string, headerBytes: number, maxBytes: number) {
    const source = new File(sourceUri);
    if (source.size > maxBytes) throw new PackRejectedError(TOO_LARGE_MESSAGE);
    const staged = stagedFile();
    deleteIfPresent(staged);
    staged.create();
    const input = source.open(FileMode.ReadOnly);
    const output = staged.open(FileMode.WriteOnly);
    try {
      const header = await input.readBytes(headerBytes);
      if (header.length < headerBytes) throw new PackRejectedError(NOT_A_PACK_MESSAGE);
      await copyRest(input, output, maxBytes);
      return header;
    } finally {
      input.close();
      output.close();
    }
  }

  return {
    stagePackFile,
    stagedDatabaseSha512: async () => hexToBytes(await stagedFile().digest('SHA-512')),
    openStagedDatabase: () => openPackDatabase(STAGED_DATABASE_NAME),
    keepStagedDatabase: async (databaseName) => {
      deleteIfPresent(databaseFile(databaseName));
      stagedFile().rename(databaseName);
    },
    discardStagedDatabase: async () => deleteIfPresent(stagedFile()),
    openInstalledDatabase: async (databaseName) =>
      databaseFile(databaseName).exists ? openPackDatabase(databaseName) : null,
    deleteDatabasesExcept: async (databaseNames) => {
      for (const entry of databaseDirectory().list()) {
        const isPackDatabase =
          entry.name.startsWith(PACK_DATABASE_PREFIX) &&
          entry.name.endsWith(PACK_DATABASE_EXTENSION);
        if (entry instanceof File && isPackDatabase && !databaseNames.includes(entry.name)) {
          entry.delete();
        }
      }
    },
  };
}
