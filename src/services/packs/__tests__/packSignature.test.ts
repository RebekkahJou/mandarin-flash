/**
 * @jest-environment node
 */
import * as ed25519 from '@noble/ed25519';
import { createHash } from 'node:crypto';

import { PackRejectedError } from '../../../domain/packMetadata';
import {
  PACK_HEADER_BYTES,
  buildPackHeader,
  packSignatureMessage,
  readPackSignature,
  verifyPackSignature,
} from '../packSignature';

function sha512(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha512').update(bytes).digest());
}

const database = new TextEncoder().encode('SQLite format 3\0 pretend database');

async function signedDigest() {
  const { secretKey, publicKey } = await ed25519.keygenAsync();
  const digest = sha512(database);
  const signature = await ed25519.signAsync(packSignatureMessage(digest), secretKey);
  return { publicKey, digest, signature };
}

describe('pack header', () => {
  it('round-trips the signature', () => {
    const signature = new Uint8Array(64).fill(7);
    const header = buildPackHeader(signature);
    expect(header).toHaveLength(PACK_HEADER_BYTES);
    expect(readPackSignature(header)).toEqual(signature);
  });

  it('rejects files that are not packs', () => {
    expect(() => readPackSignature(database)).toThrow('not a language pack');
    expect(() => readPackSignature(new Uint8Array(3))).toThrow(PackRejectedError);
  });
});

describe('verifyPackSignature', () => {
  it('accepts a database signed by a trusted key', async () => {
    const { publicKey, digest, signature } = await signedDigest();
    const otherKey = (await ed25519.keygenAsync()).publicKey;
    await expect(
      verifyPackSignature(signature, digest, [otherKey, publicKey]),
    ).resolves.toBeUndefined();
  });

  it('rejects a database that was changed after signing', async () => {
    const { publicKey, signature } = await signedDigest();
    const changedDigest = sha512(new TextEncoder().encode('changed'));
    await expect(verifyPackSignature(signature, changedDigest, [publicKey])).rejects.toThrow(
      'not signed by Mandarin Flash',
    );
  });

  it('rejects a signature from an untrusted key', async () => {
    const { digest, signature } = await signedDigest();
    const untrustedKey = (await ed25519.keygenAsync()).publicKey;
    await expect(verifyPackSignature(signature, digest, [untrustedKey])).rejects.toThrow(
      PackRejectedError,
    );
  });

  it('rejects a malformed signature without crashing', async () => {
    const { publicKey, digest } = await signedDigest();
    await expect(verifyPackSignature(new Uint8Array(5), digest, [publicKey])).rejects.toThrow(
      PackRejectedError,
    );
  });

  it('only accepts signatures made for packs', async () => {
    const { secretKey, publicKey } = await ed25519.keygenAsync();
    const digest = sha512(database);
    const plainSignature = await ed25519.signAsync(digest, secretKey);
    await expect(verifyPackSignature(plainSignature, digest, [publicKey])).rejects.toThrow(
      PackRejectedError,
    );
  });
});
