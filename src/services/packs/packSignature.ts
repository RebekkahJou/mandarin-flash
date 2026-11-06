import * as ed25519 from '@noble/ed25519';

import { PackRejectedError } from '../../domain/packMetadata';

/**
 * A pack file (.mfpack) is a header followed by the pack's SQLite database:
 *
 *   bytes 0–7    PACK_FILE_MAGIC ("MFPACK", then 0 and the file format version)
 *   bytes 8–71   Ed25519 signature of packSignatureMessage(SHA-512 of the database)
 *   bytes 72–    the SQLite database
 *
 * Signing a digest rather than the whole file lets the phone hash the database natively instead
 * of loading tens of megabytes into JavaScript.
 */
export const PACK_FILE_MAGIC = Uint8Array.of(0x4d, 0x46, 0x50, 0x41, 0x43, 0x4b, 0x00, 0x01);
export const PACK_SIGNATURE_BYTES = 64;
export const PACK_HEADER_BYTES = PACK_FILE_MAGIC.length + PACK_SIGNATURE_BYTES;
export const PACK_FILE_EXTENSION = '.mfpack';
const SHA512_BYTES = 64;

/** Ties a signature to this use, so a signature made for anything else can't pass as one. */
const SIGNATURE_CONTEXT = 'mandarin-flash-pack-signature-v1\n';

const NOT_A_PACK_MESSAGE = 'This file is not a language pack.';
const UNSIGNED_PACK_MESSAGE =
  'This language pack is not signed by Mandarin Flash, so it was not installed. Download packs ' +
  'only from the official pack page.';

/** Uses the phone's native SHA-512 for Ed25519; the library's default needs WebCrypto. */
export function setSha512ForSignatures(
  sha512: (message: Uint8Array) => Promise<Uint8Array<ArrayBuffer>>,
) {
  ed25519.hashes.sha512Async = sha512;
}

function hasMagic(header: Uint8Array): boolean {
  return PACK_FILE_MAGIC.every((byte, index) => header[index] === byte);
}

/** The signature from a pack file's first PACK_HEADER_BYTES bytes. */
export function readPackSignature(header: Uint8Array): Uint8Array {
  if (header.length < PACK_HEADER_BYTES || !hasMagic(header)) {
    throw new PackRejectedError(NOT_A_PACK_MESSAGE);
  }
  return header.slice(PACK_FILE_MAGIC.length, PACK_HEADER_BYTES);
}

export function buildPackHeader(signature: Uint8Array): Uint8Array {
  const header = new Uint8Array(PACK_HEADER_BYTES);
  header.set(PACK_FILE_MAGIC);
  header.set(signature, PACK_FILE_MAGIC.length);
  return header;
}

/** What gets signed: the context string followed by the database's SHA-512 digest. */
export function packSignatureMessage(databaseSha512: Uint8Array): Uint8Array {
  const context = new TextEncoder().encode(SIGNATURE_CONTEXT);
  const message = new Uint8Array(context.length + databaseSha512.length);
  message.set(context);
  message.set(databaseSha512, context.length);
  return message;
}

async function isSignedBy(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): Promise<boolean> {
  // The library throws on malformed signatures or keys; either way the pack isn't signed by it.
  return ed25519.verifyAsync(signature, message, publicKey).catch(() => false);
}

/** Rejects the pack unless one of the trusted keys signed this database digest. */
export async function verifyPackSignature(
  signature: Uint8Array,
  databaseSha512: Uint8Array,
  trustedPublicKeys: readonly Uint8Array[],
): Promise<void> {
  if (databaseSha512.length !== SHA512_BYTES) throw new PackRejectedError(UNSIGNED_PACK_MESSAGE);
  const message = packSignatureMessage(databaseSha512);
  for (const publicKey of trustedPublicKeys) {
    if (await isSignedBy(signature, message, publicKey)) return;
  }
  throw new PackRejectedError(UNSIGNED_PACK_MESSAGE);
}

export function hexToBytes(hex: string): Uint8Array {
  return ed25519.etc.hexToBytes(hex);
}

export function bytesToHex(bytes: Uint8Array): string {
  return ed25519.etc.bytesToHex(bytes);
}
