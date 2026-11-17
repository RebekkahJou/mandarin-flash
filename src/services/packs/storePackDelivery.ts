// Gets store packs through Play Asset Delivery: reads their state, asks Play to download one, waits
// for it and returns the downloaded file for the pack installer. Play is reached through the
// PlayAssetPacks interface, so this logic is tested without a phone.
import { PackRejectedError } from '../../domain/packMetadata';
import type { StorePack } from '../../domain/storePacks';

/** One asset pack's state as Play reports it. */
export interface AssetPackState {
  name: string;
  /** Play's AssetPackStatus value. */
  status: number;
  /** Play's AssetPackErrorCode value; 0 when there is no error. */
  errorCode: number;
  bytesDownloaded: number;
  totalBytesToDownload: number;
}

/** Play Asset Delivery as the app uses it. */
export interface PlayAssetPacks {
  getPackStates(assetPackNames: string[]): Promise<AssetPackState[]>;
  fetch(assetPackNames: string[]): Promise<AssetPackState[]>;
  /** The folder holding a downloaded pack's files; null until it is downloaded. */
  getAssetsPath(assetPackName: string): string | null;
  removePack(assetPackName: string): Promise<void>;
  /** Resolves true when the user allows a download Play is holding back. */
  showConfirmationDialog(): Promise<boolean>;
  /** Returns a function that stops listening. */
  addStateListener(listener: (state: AssetPackState) => void): () => void;
}

/** Play's AssetPackStatus values. */
export enum AssetPackStatus {
  Unknown = 0,
  Pending = 1,
  Downloading = 2,
  Transferring = 3,
  Completed = 4,
  Failed = 5,
  Canceled = 6,
  WaitingForWifi = 7,
  NotInstalled = 8,
  RequiresUserConfirmation = 9,
}

/** Play's AssetPackErrorCode values the app treats differently. */
export enum AssetPackErrorCode {
  NoError = 0,
  NetworkError = -6,
  InsufficientStorage = -10,
}

/** Where a store pack's download stands, as the app shows it. */
export enum StorePackPhase {
  /** Play can't deliver it here, e.g. the app wasn't installed from Play. */
  Unavailable = 'unavailable',
  NotDownloaded = 'not-downloaded',
  Downloading = 'downloading',
  /** Play holds the download until the user allows it or Wi-Fi is available. */
  NeedsConfirmation = 'needs-confirmation',
  Downloaded = 'downloaded',
  Failed = 'failed',
}

/** A store pack's phase and download progress. */
export interface StorePackProgress {
  phase: StorePackPhase;
  bytesDownloaded: number;
  totalBytes: number;
}

const PHASE_BY_STATUS: Record<AssetPackStatus, StorePackPhase> = {
  [AssetPackStatus.Unknown]: StorePackPhase.Unavailable,
  [AssetPackStatus.Pending]: StorePackPhase.Downloading,
  [AssetPackStatus.Downloading]: StorePackPhase.Downloading,
  [AssetPackStatus.Transferring]: StorePackPhase.Downloading,
  [AssetPackStatus.Completed]: StorePackPhase.Downloaded,
  [AssetPackStatus.Failed]: StorePackPhase.Failed,
  [AssetPackStatus.Canceled]: StorePackPhase.NotDownloaded,
  [AssetPackStatus.WaitingForWifi]: StorePackPhase.NeedsConfirmation,
  [AssetPackStatus.NotInstalled]: StorePackPhase.NotDownloaded,
  [AssetPackStatus.RequiresUserConfirmation]: StorePackPhase.NeedsConfirmation,
};

export const UNAVAILABLE_PROGRESS: StorePackProgress = {
  phase: StorePackPhase.Unavailable,
  bytesDownloaded: 0,
  totalBytes: 0,
};

export function storePackProgress(state: AssetPackState): StorePackProgress {
  return {
    phase: PHASE_BY_STATUS[state.status as AssetPackStatus] ?? StorePackPhase.Unavailable,
    bytesDownloaded: state.bytesDownloaded,
    totalBytes: state.totalBytesToDownload,
  };
}

const NETWORK_FAILURE_MESSAGE =
  'Google Play could not download the pack. Check your connection and try again.';
const STORAGE_FAILURE_MESSAGE =
  'There is not enough free space for this pack. Free up some space and try again.';
const GENERAL_FAILURE_MESSAGE = 'Google Play could not download the pack. Please try again later.';
const DECLINED_MESSAGE = 'The pack was not downloaded.';
const MISSING_FILE_MESSAGE = 'The downloaded pack could not be found. Please try again.';

export function storePackFailureMessage(errorCode: number): string {
  if (errorCode === AssetPackErrorCode.NetworkError) return NETWORK_FAILURE_MESSAGE;
  if (errorCode === AssetPackErrorCode.InsufficientStorage) return STORAGE_FAILURE_MESSAGE;
  return GENERAL_FAILURE_MESSAGE;
}

/** The download failure for a state, or null while the download can still finish. */
function stateFailure(state: AssetPackState, progress: StorePackProgress): Error | null {
  if (progress.phase === StorePackPhase.Failed) {
    return new PackRejectedError(storePackFailureMessage(state.errorCode));
  }
  if (progress.phase === StorePackPhase.Unavailable) {
    return new PackRejectedError(GENERAL_FAILURE_MESSAGE);
  }
  return null;
}

/** Play may hold a download for the user's OK; they are asked once per download. */
function waitUntilDownloaded(
  play: PlayAssetPacks,
  assetPackName: string,
  onProgress: (progress: StorePackProgress) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let isFinished = false;
    let hasAskedForConfirmation = false;
    let stopListening = () => {};
    const finish = (error: Error | null) => {
      if (isFinished) return;
      isFinished = true;
      stopListening();
      if (error) reject(error);
      else resolve();
    };
    const askForConfirmation = () => {
      hasAskedForConfirmation = true;
      play
        .showConfirmationDialog()
        .then((isAllowed) => {
          if (!isAllowed) finish(new PackRejectedError(DECLINED_MESSAGE));
        })
        .catch(() => finish(new PackRejectedError(GENERAL_FAILURE_MESSAGE)));
    };
    const handleState = (state: AssetPackState) => {
      if (isFinished || state.name !== assetPackName) return;
      const progress = storePackProgress(state);
      onProgress(progress);
      if (progress.phase === StorePackPhase.Downloaded) finish(null);
      const failure = stateFailure(state, progress);
      if (failure) finish(failure);
      const needsAsking = progress.phase === StorePackPhase.NeedsConfirmation;
      if (needsAsking && !hasAskedForConfirmation) askForConfirmation();
    };
    stopListening = play.addStateListener(handleState);
    play
      .fetch([assetPackName])
      .then((states) => states.forEach(handleState))
      .catch(() => finish(new PackRejectedError(GENERAL_FAILURE_MESSAGE)));
  });
}

export function createStorePackDelivery(play: PlayAssetPacks) {
  /** Every pack is Unavailable when Play can't be asked, e.g. on a phone without Play. */
  async function readProgress(
    storePacks: readonly StorePack[],
  ): Promise<Map<string, StorePackProgress>> {
    const names = storePacks.map((storePack) => storePack.assetPackName);
    const progressByName = new Map(names.map((name) => [name, UNAVAILABLE_PROGRESS]));
    if (names.length === 0) return progressByName;
    try {
      for (const state of await play.getPackStates(names)) {
        progressByName.set(state.name, storePackProgress(state));
      }
    } catch {
      // Play isn't reachable here; every pack stays Unavailable.
    }
    return progressByName;
  }

  function downloadedFileUri(storePack: StorePack): string {
    const assetsPath = play.getAssetsPath(storePack.assetPackName);
    if (!assetsPath) throw new PackRejectedError(MISSING_FILE_MESSAGE);
    return `file://${assetsPath}/${storePack.fileName}`;
  }

  /**
   * Asks Play for the pack and resolves with its downloaded file's URI once Play has it.
   * Throws PackRejectedError with a message for the user when the download fails or is declined.
   */
  async function download(
    storePack: StorePack,
    onProgress: (progress: StorePackProgress) => void,
  ): Promise<string> {
    await waitUntilDownloaded(play, storePack.assetPackName, onProgress);
    return downloadedFileUri(storePack);
  }

  /** Deletes Play's copy once the pack is installed; the installer keeps its own. */
  async function discardDownload(storePack: StorePack): Promise<void> {
    try {
      await play.removePack(storePack.assetPackName);
    } catch {
      // Play may already have removed it; a leftover copy only takes space until the app is removed.
    }
  }

  return { readProgress, download, discardDownload };
}

export type StorePackDelivery = ReturnType<typeof createStorePackDelivery>;
