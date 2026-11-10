import { isLanguageId, languageDefinitionFor } from './language';
import type { PackMetadata } from './packMetadata';
import { supportedLanguageIdsOf } from './packMetadata';

/** An open pack as the install rules see it. */
export interface PackSummary {
  metadata: PackMetadata;
  isBuiltIn: boolean;
}

/** Why this pack can't be installed next to the open ones, or null when it can. */
export function packInstallProblem(
  candidate: PackMetadata,
  openPacks: readonly PackSummary[],
): string | null {
  if (supportedLanguageIdsOf(candidate).length === 0) {
    return `The ${candidate.title} pack is for a language this version of the app can't teach yet. Update the app, then open the pack again.`;
  }
  const newestSamePack = openPacks
    .map((pack) => pack.metadata)
    .filter((metadata) => metadata.packId === candidate.packId)
    .sort((first, second) => second.packVersion - first.packVersion)[0];
  if (!newestSamePack || newestSamePack.packVersion < candidate.packVersion) return null;
  if (newestSamePack.packVersion === candidate.packVersion) {
    return `The ${candidate.title} pack (version ${candidate.packVersion}) is already installed.`;
  }
  return `A newer ${candidate.title} pack (version ${newestSamePack.packVersion}) is already installed.`;
}

/**
 * Why this pack can't be removed, or null when it can. A language that profiles use must keep a
 * pack, so a pack can only go if another pack serves those languages too.
 */
export function packRemovalProblem(
  pack: PackSummary,
  openPacks: readonly PackSummary[],
  languageIdsInUse: ReadonlySet<string>,
): string | null {
  if (pack.isBuiltIn) return `The ${pack.metadata.title} pack is part of the app.`;
  const otherPacks = openPacks.filter((other) => other !== pack);
  const strandedLanguageIds = pack.metadata.languageIds.filter(
    (languageId) =>
      languageIdsInUse.has(languageId) &&
      !otherPacks.some((other) => other.metadata.languageIds.includes(languageId)),
  );
  if (strandedLanguageIds.length === 0) return null;
  const languageNames = strandedLanguageIds
    .filter(isLanguageId)
    .map((languageId) => languageDefinitionFor(languageId).name);
  return `Profiles still learn ${languageNames.join(' and ')}. Delete those profiles first.`;
}
