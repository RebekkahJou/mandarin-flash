/**
 * Creates the Ed25519 key pair that signs language packs. Run once, on a developer machine:
 *
 *   npm run pack:generate-key [-- --key <path>]
 *
 * Writes the private key to ~/.mandarin-flash/pack-signing-key.hex (never into the repository)
 * and prints the public key to add to TRUSTED_PACK_PUBLIC_KEYS in
 * src/services/packs/trustedPackKeys.ts. Refuses to overwrite an existing key.
 */
import * as ed25519 from '@noble/ed25519';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { signingKeyPathFrom } from './lib/packSigningKey';

async function main(): Promise<void> {
  const keyPath = signingKeyPathFrom(process.argv.slice(2));
  if (existsSync(keyPath)) {
    console.error(
      `A key already exists at ${keyPath}. Move it away first if you mean to replace it.`,
    );
    process.exit(1);
  }
  const { secretKey, publicKey } = await ed25519.keygenAsync();
  mkdirSync(path.dirname(keyPath), { recursive: true });
  // Owner-only permissions where the file system supports them.
  writeFileSync(keyPath, ed25519.etc.bytesToHex(secretKey), { encoding: 'utf8', mode: 0o600 });
  console.log(`Private key written to ${keyPath}. Back it up somewhere safe and offline.`);
  console.log(`Public key: ${ed25519.etc.bytesToHex(publicKey)}`);
}

void main();
