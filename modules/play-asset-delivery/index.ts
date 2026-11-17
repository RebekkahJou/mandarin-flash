// Typed handle on the Android PlayAssetDelivery native module. It is null where the module isn't
// built in (iOS, tests), so callers treat Play delivery as unavailable there.
import type { NativeModule } from 'expo';
import { requireOptionalNativeModule } from 'expo';

/** One asset pack's state as Play reports it. */
export interface NativeAssetPackState {
  /** The asset pack name from the app bundle. */
  name: string;
  /** Play's AssetPackStatus value. */
  status: number;
  /** Play's AssetPackErrorCode value; 0 when there is no error. */
  errorCode: number;
  bytesDownloaded: number;
  /** The pack's download size, known before it is downloaded. */
  totalBytesToDownload: number;
}

interface PlayAssetDeliveryEvents {
  [eventName: string]: (state: NativeAssetPackState) => void;
  onPackStateChanged: (state: NativeAssetPackState) => void;
}

declare class PlayAssetDeliveryNativeModule extends NativeModule<PlayAssetDeliveryEvents> {
  getPackStates(packNames: string[]): Promise<NativeAssetPackState[]>;
  fetch(packNames: string[]): Promise<NativeAssetPackState[]>;
  /** The folder holding a downloaded pack's files; null until the pack is downloaded. */
  getAssetsPath(packName: string): string | null;
  /** Deletes Play's unpacked copy of a pack. */
  removePack(packName: string): Promise<void>;
  /** Asks the user to allow a download Play is holding back (e.g. on mobile data). */
  showConfirmationDialog(): Promise<boolean>;
}

export const PlayAssetDelivery =
  requireOptionalNativeModule<PlayAssetDeliveryNativeModule>('PlayAssetDelivery');
