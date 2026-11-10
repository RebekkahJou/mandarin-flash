/**
 * @jest-environment node
 */
import * as ed25519 from '@noble/ed25519';
import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { migrateUserDatabase } from '../../../data/migrations/userDatabaseMigrations';
import { PACK_FORMAT_NAME, PACK_SCHEMA_SQL } from '../../../data/packSchema';
import { createInstalledPackRepository } from '../../../data/repositories/installedPackRepository';
import { createInMemoryDatabase, openNodeDatabase } from '../../../data/testing/nodeSqlDatabase';
import { TEST_PACK_METADATA } from '../../../data/testing/testPack';
import type { PackMetadata } from '../../../domain/packMetadata';
import { PackRejectedError, packMetadataRows } from '../../../domain/packMetadata';
import type { LoadedPack } from '../loadedPack';
import type { PackFileStore } from '../packInstaller';
import { createPackInstaller, installedPackDatabaseName } from '../packInstaller';
import { buildPackHeader, packSignatureMessage } from '../packSignature';

function sha512(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha512').update(bytes).digest());
}

/** The app's file store, with Node's file system standing in for the phone's. */
function createNodeFileStore(directory: string): PackFileStore {
  const stagedPath = path.join(directory, 'staging.db');
  return {
    async stagePackFile(sourceUri, headerBytes, maxBytes) {
      const bytes = readFileSync(sourceUri);
      if (bytes.length > maxBytes) throw new PackRejectedError('too large');
      writeFileSync(stagedPath, bytes.subarray(headerBytes));
      return new Uint8Array(bytes.subarray(0, headerBytes));
    },
    stagedDatabaseSha512: async () => sha512(readFileSync(stagedPath)),
    openStagedDatabase: async () => openNodeDatabase(stagedPath),
    keepStagedDatabase: async (databaseName) => {
      renameSync(stagedPath, path.join(directory, databaseName));
    },
    discardStagedDatabase: async () => rmSync(stagedPath, { force: true }),
    openInstalledDatabase: async (databaseName) => {
      const filePath = path.join(directory, databaseName);
      return existsSync(filePath) ? openNodeDatabase(filePath) : null;
    },
    deletePacksExcept: async (databaseNames) => {
      for (const fileName of readdirSync(directory)) {
        const isKept = databaseNames.some((name) => fileName.startsWith(name));
        if (fileName.startsWith('pack-') && !isKept) {
          rmSync(path.join(directory, fileName), { recursive: true });
        }
      }
    },
    hasPackFile: (databaseName, fileName) =>
      existsSync(path.join(directory, `${databaseName}-files`, fileName)),
    writePackFile: async (databaseName, fileName, data) => {
      mkdirSync(path.join(directory, `${databaseName}-files`), { recursive: true });
      writeFileSync(path.join(directory, `${databaseName}-files`, fileName), data);
    },
    packFileUri: (databaseName, fileName) =>
      `file://${path.join(directory, `${databaseName}-files`, fileName)}`,
  };
}

let directory: string;
let keys: { secretKey: Uint8Array; publicKey: Uint8Array };

beforeAll(async () => {
  keys = await ed25519.keygenAsync();
});

beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), 'packs-'));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

const FONT_BYTES = new Uint8Array([0, 1, 0, 0, 42]);

/** Writes a signed .mfpack file and returns its path. */
async function writeSignedPack(
  metadata: PackMetadata,
  secretKey = keys.secretKey,
  fontNames: readonly string[] = [],
) {
  const databasePath = path.join(directory, 'source.db');
  const database = new Database(databasePath);
  database.exec(PACK_SCHEMA_SQL);
  const insert = database.prepare('INSERT INTO pack_metadata (key, value) VALUES (?, ?)');
  for (const [key, value] of packMetadataRows(metadata, PACK_FORMAT_NAME)) insert.run(key, value);
  const insertFile = database.prepare('INSERT INTO pack_files (name, kind, data) VALUES (?, ?, ?)');
  for (const fontName of fontNames) insertFile.run(fontName, 'font', FONT_BYTES);
  database.close();
  const databaseBytes = new Uint8Array(readFileSync(databasePath));
  rmSync(databasePath);
  const message = packSignatureMessage(sha512(databaseBytes));
  const signature = await ed25519.signAsync(message, secretKey);
  const packPath = path.join(directory, `${metadata.packId}-${metadata.packVersion}.mfpack`);
  writeFileSync(packPath, Buffer.concat([buildPackHeader(signature), databaseBytes]));
  return packPath;
}

async function setUp() {
  const userDatabase = createInMemoryDatabase();
  await migrateUserDatabase(userDatabase);
  const installedPackRepository = createInstalledPackRepository(userDatabase);
  const installer = createPackInstaller({
    fileStore: createNodeFileStore(directory),
    installedPackRepository,
    trustedPublicKeys: [keys.publicKey],
    now: () => 42,
  });
  const builtIn: LoadedPack = {
    metadata: TEST_PACK_METADATA,
    database: createInMemoryDatabase(),
    isBuiltIn: true,
    fonts: [],
  };
  return { installer, installedPackRepository, builtIn };
}

const UPDATE_METADATA = { ...TEST_PACK_METADATA, packVersion: 2 };

describe('packInstaller', () => {
  it('installs a signed newer pack and opens it again at the next start', async () => {
    const { installer, installedPackRepository, builtIn } = await setUp();
    const installed = await installer.install(await writeSignedPack(UPDATE_METADATA), [builtIn]);
    expect(installed.metadata).toEqual(UPDATE_METADATA);
    expect(installed.isBuiltIn).toBe(false);
    await installed.database.close();
    expect(await installedPackRepository.listInstalledPacks()).toEqual([
      {
        packId: 'mandarin',
        packVersion: 2,
        databaseName: installedPackDatabaseName(UPDATE_METADATA),
        installedAtMs: 42,
      },
    ]);

    const reopened = await installer.loadInstalledPacks();
    expect(reopened.map((pack) => pack.metadata)).toEqual([UPDATE_METADATA]);
    await reopened[0].database.close();
  });

  it('writes out the pack fonts and writes them again if they go missing', async () => {
    const { installer, builtIn } = await setUp();
    const packPath = await writeSignedPack(UPDATE_METADATA, keys.secretKey, ['NotoSansSC.otf']);
    const installed = await installer.install(packPath, [builtIn]);
    expect(installed.fonts).toEqual([
      {
        family: 'mandarin-NotoSansSC',
        uri: expect.stringContaining('NotoSansSC.otf'),
      },
    ]);
    const fontPath = path.join(directory, 'pack-mandarin-v2.db-files', 'NotoSansSC.otf');
    expect(new Uint8Array(readFileSync(fontPath))).toEqual(FONT_BYTES);
    await installed.database.close();

    rmSync(fontPath);
    const [reopened] = await installer.loadInstalledPacks();
    expect(reopened.fonts.map((font) => font.family)).toEqual(['mandarin-NotoSansSC']);
    expect(existsSync(fontPath)).toBe(true);
    await reopened.database.close();
  });

  it('rejects a pack signed by an untrusted key and keeps nothing', async () => {
    const { installer, installedPackRepository, builtIn } = await setUp();
    const otherKey = (await ed25519.keygenAsync()).secretKey;
    const packPath = await writeSignedPack(UPDATE_METADATA, otherKey);
    await expect(installer.install(packPath, [builtIn])).rejects.toThrow(
      'not signed by Mandarin Flash',
    );
    expect(await installedPackRepository.listInstalledPacks()).toEqual([]);
    expect(readdirSync(directory)).toEqual([path.basename(packPath)]);
  });

  it('rejects a pack whose database was changed after signing', async () => {
    const { installer, builtIn } = await setUp();
    const packPath = await writeSignedPack(UPDATE_METADATA);
    const bytes = readFileSync(packPath);
    bytes[bytes.length - 1] ^= 1;
    writeFileSync(packPath, bytes);
    await expect(installer.install(packPath, [builtIn])).rejects.toThrow(PackRejectedError);
  });

  it('rejects a version that is already installed', async () => {
    const { installer, builtIn } = await setUp();
    const packPath = await writeSignedPack(TEST_PACK_METADATA);
    await expect(installer.install(packPath, [builtIn])).rejects.toThrow('already installed');
  });

  it('forgets packs whose file is gone and deletes files no longer needed', async () => {
    const { installer, installedPackRepository } = await setUp();
    await installedPackRepository.saveInstalledPack({
      packId: 'mandarin',
      packVersion: 2,
      databaseName: 'pack-mandarin-v2.db',
      installedAtMs: 1,
    });
    writeFileSync(path.join(directory, 'pack-mandarin-v1.db'), 'replaced earlier');
    expect(await installer.loadInstalledPacks()).toEqual([]);
    expect(await installedPackRepository.listInstalledPacks()).toEqual([]);
    expect(readdirSync(directory)).toEqual([]);
  });
});
