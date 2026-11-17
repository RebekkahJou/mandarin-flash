// Language packs Google Play delivers on demand (route A), listed in storePackCatalog.json so
// plugins/withPlayAssetPacks.ts can read the same list when it puts each pack's signed file into
// its own asset pack in the app bundle. Each file is installed through the same signature check as
// a pack file the user opens.
import type { LanguageId } from './language';
import { isLanguageId } from './language';
import storePackCatalog from './storePackCatalog.json';

export interface StorePack {
  /** Play asset pack name: a letter, then letters, digits or underscores. */
  assetPackName: string;
  /** The signed .mfpack file, relative to the project root; the build copies it into the bundle. */
  sourcePath: string;
  /** The file's name inside the downloaded asset pack. */
  fileName: string;
  /** Must match the pack file's metadata, to tell whether the pack is already installed. */
  packId: string;
  packVersion: number;
  title: string;
  languageIds: readonly LanguageId[];
  /** Test packs only go into development builds. */
  isTestPack: boolean;
}

export const STORE_PACKS: readonly StorePack[] = storePackCatalog.map((record) => ({
  ...record,
  languageIds: record.languageIds.filter(isLanguageId),
}));

export const ASSET_PACK_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

export function storePacksForBuild(
  catalog: readonly StorePack[],
  isDevelopmentBuild: boolean,
): StorePack[] {
  return catalog.filter((storePack) => isDevelopmentBuild || !storePack.isTestPack);
}

/** A pack, from the store or a file, that the app has open. */
export interface OpenPackVersion {
  packId: string;
  packVersion: number;
}

/** True when an open pack is this store pack or a newer version of it. */
export function isStorePackInstalled(
  storePack: StorePack,
  openPacks: readonly OpenPackVersion[],
): boolean {
  return openPacks.some(
    (openPack) =>
      openPack.packId === storePack.packId && openPack.packVersion >= storePack.packVersion,
  );
}
