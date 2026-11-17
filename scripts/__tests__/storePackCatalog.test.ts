/**
 * @jest-environment node
 */
// Checks each store pack file that has been made against its catalog entry, so a pack bumped in
// one place but not the other can't ship. Files are made locally (dist/ is git-ignored), so a
// missing file is skipped here; a release build stops on a missing non-test pack instead.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { validatePackDatabase } from '../../src/data/packValidation';
import { openNodeDatabase } from '../../src/data/testing/nodeSqlDatabase';
import type { StorePack } from '../../src/domain/storePacks';
import { STORE_PACKS } from '../../src/domain/storePacks';
import {
  PACK_FILE_EXTENSION,
  PACK_HEADER_BYTES,
  readPackSignature,
  verifyPackSignature,
} from '../../src/services/packs/packSignature';
import { TRUSTED_PACK_PUBLIC_KEYS } from '../../src/services/packs/trustedPackKeys';
import { sha512 } from '../lib/packSigningKey';

const PROJECT_ROOT = path.join(__dirname, '..', '..');

function sourceFile(storePack: StorePack): string {
  return path.join(PROJECT_ROOT, storePack.sourcePath);
}

const packsWithFiles = STORE_PACKS.filter((storePack) => existsSync(sourceFile(storePack)));

describe('store pack catalog', () => {
  it.each(STORE_PACKS.map((storePack) => [storePack.assetPackName, storePack]))(
    '%s names a signed pack file',
    (_name, storePack) => {
      expect(storePack.sourcePath.endsWith(PACK_FILE_EXTENSION)).toBe(true);
      expect(storePack.fileName.endsWith(PACK_FILE_EXTENSION)).toBe(true);
      expect(storePack.languageIds.length).toBeGreaterThan(0);
    },
  );
});

const describeIfFiles = packsWithFiles.length > 0 ? describe : describe.skip;

describeIfFiles('store pack files', () => {
  let workFolder: string;

  beforeAll(() => {
    workFolder = mkdtempSync(path.join(tmpdir(), 'store-pack-check-'));
  });

  afterAll(() => rmSync(workFolder, { recursive: true, force: true }));

  it.each(packsWithFiles.map((storePack) => [storePack.sourcePath, storePack]))(
    '%s is signed and matches its catalog entry',
    async (_sourcePath, storePack) => {
      const fileBytes = new Uint8Array(readFileSync(sourceFile(storePack)));
      const databaseBytes = fileBytes.subarray(PACK_HEADER_BYTES);
      const signature = readPackSignature(fileBytes.subarray(0, PACK_HEADER_BYTES));
      await verifyPackSignature(signature, sha512(databaseBytes), TRUSTED_PACK_PUBLIC_KEYS);

      const databasePath = path.join(workFolder, `${storePack.assetPackName}.db`);
      writeFileSync(databasePath, databaseBytes);
      const database = openNodeDatabase(databasePath);
      try {
        const metadata = await validatePackDatabase(database);
        expect(metadata.packId).toBe(storePack.packId);
        expect(metadata.packVersion).toBe(storePack.packVersion);
        expect([...metadata.languageIds].sort()).toEqual([...storePack.languageIds].sort());
      } finally {
        await database.close();
      }
    },
    60_000,
  );
});
