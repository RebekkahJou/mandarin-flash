import type { SqlDatabase } from '../../data/sqlDatabase';
import type { LanguageId } from '../../domain/language';
import type { PackMetadata } from '../../domain/packMetadata';

/** A font a pack brought, written to app storage and registered under its family name. */
export interface PackFont {
  family: string;
  uri: string;
}

/** An open, read-only language pack. */
export interface LoadedPack {
  metadata: PackMetadata;
  database: SqlDatabase;
  /** Shipped inside the app rather than installed by the user. */
  isBuiltIn: boolean;
  /** Fonts for the pack's languages; the built-in pack's fonts are bundled assets instead. */
  fonts: PackFont[];
}

/**
 * The pack a language reads from: the newest version among packs serving it, so an installed
 * update replaces the built-in pack. Undefined when no pack serves the language.
 */
export function packForLanguage(
  packs: readonly LoadedPack[],
  languageId: LanguageId,
): LoadedPack | undefined {
  return packs
    .filter((pack) => pack.metadata.languageIds.includes(languageId))
    .reduce<LoadedPack | undefined>(
      (newest, pack) =>
        !newest || pack.metadata.packVersion > newest.metadata.packVersion ? pack : newest,
      undefined,
    );
}
