import type { SqlDatabase } from '../../data/sqlDatabase';
import type { LanguageId } from '../../domain/language';
import type { PackMetadata } from '../../domain/packMetadata';

/** An open, read-only language pack. */
export interface LoadedPack {
  metadata: PackMetadata;
  database: SqlDatabase;
  /** Shipped inside the app rather than installed by the user. */
  isBuiltIn: boolean;
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
