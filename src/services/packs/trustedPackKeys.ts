import { hexToBytes } from './packSignature';

/**
 * Public keys whose signatures the app accepts on imported packs. The matching private key is
 * kept off the device and out of the repository (see docs/RELEASE.md). To replace a key, add the
 * new one here first and keep the old one until no published pack needs it.
 */
const TRUSTED_PACK_PUBLIC_KEYS_HEX: readonly string[] = [
  // Created 2026-11-06 with npm run pack:generate-key.
  '0c66020089877999cf3c1924ce0ad4309a0ef6fb0ecf41a4fdd1d4a45534de99',
];

export const TRUSTED_PACK_PUBLIC_KEYS: readonly Uint8Array[] =
  TRUSTED_PACK_PUBLIC_KEYS_HEX.map(hexToBytes);
