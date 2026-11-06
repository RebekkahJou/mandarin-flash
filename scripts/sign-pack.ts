/**
 * Turns a pack database into a signed pack file that the app can install:
 *
 *   npm run pack:sign -- <pack.db> <output.mfpack> [--key <path>]
 *
 * The pack is validated exactly as the app will validate it before it is signed, so a pack that
 * the app would reject is never published.
 */
import * as ed25519 from '@noble/ed25519';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

import { validatePackDatabase } from '../src/data/packValidation';
import { openNodeDatabase } from '../src/data/testing/nodeSqlDatabase';
import {
  PACK_FILE_EXTENSION,
  buildPackHeader,
  packSignatureMessage,
  verifyPackSignature,
} from '../src/services/packs/packSignature';
import { TRUSTED_PACK_PUBLIC_KEYS } from '../src/services/packs/trustedPackKeys';
import { signingKeyPathFrom, sha512 } from './lib/packSigningKey';

const BYTES_PER_MEGABYTE = 1024 * 1024;

async function main(): Promise<void> {
  const [databasePath, outputPath] = process.argv.slice(2);
  if (!databasePath || !outputPath?.endsWith(PACK_FILE_EXTENSION)) {
    console.error(
      `Usage: npm run pack:sign -- <pack.db> <output${PACK_FILE_EXTENSION}> [--key <path>]`,
    );
    process.exit(1);
  }
  const metadata = await validatePackDatabase(openNodeDatabase(databasePath));
  const secretKey = ed25519.etc.hexToBytes(
    readFileSync(signingKeyPathFrom(process.argv.slice(2)), 'utf8').trim(),
  );
  const database = new Uint8Array(readFileSync(databasePath));
  const digest = sha512(database);
  const signature = await ed25519.signAsync(packSignatureMessage(digest), secretKey);
  // Checks the signature the same way the app will, so a key the app doesn't trust fails here.
  await verifyPackSignature(signature, digest, TRUSTED_PACK_PUBLIC_KEYS);
  writeFileSync(outputPath, Buffer.concat([buildPackHeader(signature), database]));
  const sizeInMegabytes = (statSync(outputPath).size / BYTES_PER_MEGABYTE).toFixed(1);
  console.log(
    `Signed ${metadata.title} pack version ${metadata.packVersion} → ${outputPath} (${sizeInMegabytes} MB).`,
  );
}

void main();
