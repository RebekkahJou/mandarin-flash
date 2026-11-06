import { readPackMetadata, validatePackDatabase } from '../../data/packValidation';
import type { InstalledPackRepository } from '../../data/repositories/installedPackRepository';
import type { SqlDatabase } from '../../data/sqlDatabase';
import type { PackMetadata } from '../../domain/packMetadata';
import { PackRejectedError } from '../../domain/packMetadata';
import { packInstallProblem } from '../../domain/packInstallRules';
import type { LoadedPack } from './loadedPack';
import { PACK_HEADER_BYTES, readPackSignature, verifyPackSignature } from './packSignature';

/** Far above any real pack (about 25 MB at most), low enough to refuse a runaway file early. */
export const MAX_PACK_FILE_BYTES = 60 * 1024 * 1024;

/** Where pack databases are kept. The app implements it with the phone's file system. */
export interface PackFileStore {
  /**
   * Copies a pack file into app storage: returns its header and keeps the rest as the staged
   * database. Throws PackRejectedError when the file is larger than maxBytes.
   */
  stagePackFile(sourceUri: string, headerBytes: number, maxBytes: number): Promise<Uint8Array>;
  stagedDatabaseSha512(): Promise<Uint8Array>;
  openStagedDatabase(): Promise<SqlDatabase>;
  /** Moves the staged database to its permanent name. */
  keepStagedDatabase(databaseName: string): Promise<void>;
  discardStagedDatabase(): Promise<void>;
  /** Opens an installed pack read-only; null when its file is missing. */
  openInstalledDatabase(databaseName: string): Promise<SqlDatabase | null>;
  /** Deletes installed pack databases other than these, e.g. versions replaced by an update. */
  deleteDatabasesExcept(databaseNames: readonly string[]): Promise<void>;
}

interface PackInstallerDependencies {
  fileStore: PackFileStore;
  installedPackRepository: InstalledPackRepository;
  trustedPublicKeys: readonly Uint8Array[];
  now?: () => number;
}

export function installedPackDatabaseName(metadata: PackMetadata): string {
  // Pack ids are limited to [a-z0-9-] by parsePackMetadata, so this is a safe file name.
  return `pack-${metadata.packId}-v${metadata.packVersion}.db`;
}

export function createPackInstaller({
  fileStore,
  installedPackRepository,
  trustedPublicKeys,
  now = Date.now,
}: PackInstallerDependencies) {
  /** Signature first, so nothing in a file that isn't ours is ever read as a database. */
  async function verifyAndValidate(
    header: Uint8Array,
    openPacks: readonly LoadedPack[],
  ): Promise<PackMetadata> {
    await verifyPackSignature(
      readPackSignature(header),
      await fileStore.stagedDatabaseSha512(),
      trustedPublicKeys,
    );
    const stagedDatabase = await fileStore.openStagedDatabase();
    try {
      const metadata = await validatePackDatabase(stagedDatabase);
      const problem = packInstallProblem(metadata, openPacks);
      if (problem) throw new PackRejectedError(problem);
      return metadata;
    } finally {
      await stagedDatabase.close();
    }
  }

  /**
   * Verifies, checks and installs a pack file, and returns it opened. An older installed version
   * of the same pack stays open until the app restarts; its file is deleted then.
   */
  async function install(sourceUri: string, openPacks: readonly LoadedPack[]): Promise<LoadedPack> {
    let metadata: PackMetadata;
    try {
      const header = await fileStore.stagePackFile(
        sourceUri,
        PACK_HEADER_BYTES,
        MAX_PACK_FILE_BYTES,
      );
      metadata = await verifyAndValidate(header, openPacks);
      await fileStore.keepStagedDatabase(installedPackDatabaseName(metadata));
    } catch (error) {
      await fileStore.discardStagedDatabase();
      throw error;
    }
    const databaseName = installedPackDatabaseName(metadata);
    await installedPackRepository.saveInstalledPack({
      packId: metadata.packId,
      packVersion: metadata.packVersion,
      databaseName,
      installedAtMs: now(),
    });
    const database = await fileStore.openInstalledDatabase(databaseName);
    if (!database) throw new Error(`The installed pack ${databaseName} could not be opened.`);
    return { metadata, database, isBuiltIn: false };
  }

  async function openInstalledPack(databaseName: string): Promise<LoadedPack | null> {
    const database = await fileStore.openInstalledDatabase(databaseName);
    if (!database) return null;
    try {
      return { metadata: await readPackMetadata(database), database, isBuiltIn: false };
    } catch {
      await database.close();
      return null;
    }
  }

  /**
   * Opens every installed pack at startup. A pack whose file is gone or unreadable is forgotten,
   * and files of replaced or removed packs are deleted.
   */
  async function loadInstalledPacks(): Promise<LoadedPack[]> {
    const packs: LoadedPack[] = [];
    const keptDatabaseNames: string[] = [];
    for (const record of await installedPackRepository.listInstalledPacks()) {
      const pack = await openInstalledPack(record.databaseName);
      if (!pack) {
        await installedPackRepository.removeInstalledPack(record.packId);
        continue;
      }
      packs.push(pack);
      keptDatabaseNames.push(record.databaseName);
    }
    await fileStore.deleteDatabasesExcept(keptDatabaseNames);
    return packs;
  }

  /** Forgets an installed pack; its file is deleted at the next start, once nothing reads it. */
  async function remove(pack: LoadedPack): Promise<void> {
    await installedPackRepository.removeInstalledPack(pack.metadata.packId);
  }

  return { install, loadInstalledPacks, remove };
}

export type PackInstaller = ReturnType<typeof createPackInstaller>;
