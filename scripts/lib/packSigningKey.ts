import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import path from 'node:path';

/**
 * The private key that signs packs lives outside the repository, on the developer's machine
 * only. Losing it means packs signed with a new key need an app update that trusts that key.
 * See docs/RELEASE.md.
 */
export const DEFAULT_SIGNING_KEY_PATH = path.join(
  homedir(),
  '.mandarin-flash',
  'pack-signing-key.hex',
);

export function sha512(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha512').update(bytes).digest());
}

/** "--key <path>" from the command line, or the default location. */
export function signingKeyPathFrom(args: readonly string[]): string {
  const keyFlagIndex = args.indexOf('--key');
  return keyFlagIndex >= 0 ? args[keyFlagIndex + 1] : DEFAULT_SIGNING_KEY_PATH;
}
