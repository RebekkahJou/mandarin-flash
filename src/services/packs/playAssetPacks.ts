// The phone's Play Asset Delivery, or null where the native module isn't built in (iOS, tests).
import { PlayAssetDelivery } from '../../../modules/play-asset-delivery';
import type { PlayAssetPacks } from './storePackDelivery';

const STATE_CHANGED_EVENT = 'onPackStateChanged';

function createPlayAssetPacks(): PlayAssetPacks | null {
  const native = PlayAssetDelivery;
  if (!native) return null;
  return {
    getPackStates: (assetPackNames) => native.getPackStates(assetPackNames),
    fetch: (assetPackNames) => native.fetch(assetPackNames),
    getAssetsPath: (assetPackName) => native.getAssetsPath(assetPackName),
    removePack: (assetPackName) => native.removePack(assetPackName),
    showConfirmationDialog: () => native.showConfirmationDialog(),
    addStateListener: (listener) => {
      const subscription = native.addListener(STATE_CHANGED_EVENT, listener);
      return () => subscription.remove();
    },
  };
}

export const playAssetPacks = createPlayAssetPacks();
