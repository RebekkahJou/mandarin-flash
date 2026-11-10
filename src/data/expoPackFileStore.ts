import type { FileHandle } from 'expo-file-system';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
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
/** Fonts and other pack files: one folder per installed pack, named after its database. */
const PACK_FILES_DIRECTORY_NAME = 'packs';

const TOO_LARGE_MESSAGE = 'This file is too large to be a language pack.';
const NOT_A_PACK_MESSAGE = 'This file is not a language pack.';

function databaseDirectory(): Directory {
  return new Directory(`file://${defaultDatabaseDirectory as string}`);
}

function databaseFile(databaseName: string): File {
  return new File(databaseDirectory(), databaseName);
}

/** Some content providers can't report a size; the copy enforces the limit then. */
function sizeIfKnown(file: File): number {
  try {
    return file.size;
  } catch {
    return 0;
  }
}

function deleteIfPresent(file: File | Directory): void {
  if (file.exists) file.delete();
}

function packFilesRoot(): Directory {
  return new Directory(Paths.document, PACK_FILES_DIRECTORY_NAME);
}

function packFilesFolderName(databaseName: string): string {
  return databaseName.slice(0, -PACK_DATABASE_EXTENSION.length);
}

function packFilesFolder(databaseName: string): Directory {
  return new Directory(packFilesRoot(), packFilesFolderName(databaseName));
}

function deleteOtherPackDatabases(keptNames: readonly string[]): void {
  for (const entry of databaseDirectory().list()) {
    const isPackDatabase =
      entry.name.startsWith(PACK_DATABASE_PREFIX) && entry.name.endsWith(PACK_DATABASE_EXTENSION);
    if (entry instanceof File && isPackDatabase && !keptNames.includes(entry.name)) entry.delete();
  }
}

function deleteOtherPackFolders(keptNames: readonly string[]): void {
  const root = packFilesRoot();
  if (!root.exists) return;
  const keptFolders = keptNames.map(packFilesFolderName);
  for (const entry of root.list()) {
    if (!keptFolders.includes(entry.name)) entry.delete();
  }
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
    if (sizeIfKnown(source) > maxBytes) throw new PackRejectedError(TOO_LARGE_MESSAGE);
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
    deletePacksExcept: async (databaseNames) => {
      deleteOtherPackDatabases(databaseNames);
      deleteOtherPackFolders(databaseNames);
    },
    hasPackFile: (databaseName, fileName) =>
      new File(packFilesFolder(databaseName), fileName).exists,
    writePackFile: async (databaseName, fileName, data) => {
      const folder = packFilesFolder(databaseName);
      if (!folder.exists) folder.create({ intermediates: true });
      const file = new File(folder, fileName);
      deleteIfPresent(file);
      file.create();
      file.write(data);
    },
    packFileUri: (databaseName, fileName) => new File(packFilesFolder(databaseName), fileName).uri,
  };
}
