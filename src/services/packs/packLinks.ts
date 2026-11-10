export const PACK_INSTALL_PATHNAME = '/packs/install';

/** Android hands an opened file over as a content:// (or older file://) URI. */
const OPENED_FILE_PATTERN = /^(content|file):\/\//i;

/**
 * Where a link the system opens the app with should lead. A file opened with the app (route B:
 * tapping "Open" on a downloaded .mfpack) goes to the pack installer; anything else is unchanged.
 */
export function routeForIncomingLink(path: string): string {
  if (!OPENED_FILE_PATTERN.test(path)) return path;
  return `${PACK_INSTALL_PATHNAME}?uri=${encodeURIComponent(path)}`;
}
