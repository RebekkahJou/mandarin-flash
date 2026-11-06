import { isLanguageId, languageDefinitionFor } from '../../domain/language';
import type { PackMetadata } from '../../domain/packMetadata';
import { PackRejectedError } from '../../domain/packMetadata';

const UNEXPECTED_FAILURE_MESSAGE = 'The language pack could not be installed. Please try again.';

/** The reason to show when installing or removing a pack fails. */
export function packFailureMessage(error: unknown): string {
  return error instanceof PackRejectedError ? error.message : UNEXPECTED_FAILURE_MESSAGE;
}

/** e.g. "Mandarin (Traditional), Mandarin (Simplified)"; ids this app doesn't know stay as is. */
export function packLanguageNames(metadata: PackMetadata): string {
  return metadata.languageIds
    .map((languageId) =>
      isLanguageId(languageId) ? languageDefinitionFor(languageId).name : languageId,
    )
    .join(', ');
}

export function packInstalledMessage(metadata: PackMetadata): string {
  return `The ${metadata.title} pack (version ${metadata.packVersion}) is installed. ${packLanguageNames(metadata)} now use it.`;
}
