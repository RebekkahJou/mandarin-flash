import { isLanguageId, languageDefinitionFor } from '../../domain/language';
import type { PackMetadata } from '../../domain/packMetadata';
import { PackRejectedError } from '../../domain/packMetadata';
import type { StorePackProgress } from './storePackDelivery';
import { StorePackPhase } from './storePackDelivery';

const UNEXPECTED_FAILURE_MESSAGE = 'The language pack could not be installed. Please try again.';

/** The reason to show when installing or removing a pack fails. */
export function packFailureMessage(error: unknown): string {
  return error instanceof PackRejectedError ? error.message : UNEXPECTED_FAILURE_MESSAGE;
}

/** e.g. "Mandarin (Traditional), Mandarin (Simplified)"; ids this app doesn't know stay as is. */
export function packLanguageNames(metadata: { languageIds: readonly string[] }): string {
  return metadata.languageIds
    .map((languageId) =>
      isLanguageId(languageId) ? languageDefinitionFor(languageId).name : languageId,
    )
    .join(', ');
}

export function packInstalledMessage(metadata: PackMetadata): string {
  return `The ${metadata.title} pack (version ${metadata.packVersion}) is installed. ${packLanguageNames(metadata)} now use it.`;
}

const BYTES_PER_MEGABYTE = 1_000_000;
const PERCENT = 100;

/** Rounded, and never "0 MB", since even a small pack is worth a mention. */
export function megabytesLabel(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / BYTES_PER_MEGABYTE))} MB`;
}

function downloadPercent(progress: StorePackProgress): number {
  if (progress.totalBytes <= 0) return 0;
  return Math.floor((progress.bytesDownloaded / progress.totalBytes) * PERCENT);
}

/** What a store pack row says about its download, e.g. "Downloading… 40%". */
export function storePackStatusText(progress: StorePackProgress): string {
  switch (progress.phase) {
    case StorePackPhase.Downloading:
      return `Downloading… ${downloadPercent(progress)}%`;
    case StorePackPhase.NeedsConfirmation:
      return 'Waiting for Wi-Fi or your OK in Google Play.';
    case StorePackPhase.Downloaded:
      return 'Downloaded. Tap Install to finish.';
    case StorePackPhase.Failed:
      return 'The last download did not finish. Tap Get to try again.';
    default:
      return `${megabytesLabel(progress.totalBytes)} from Google Play.`;
  }
}
