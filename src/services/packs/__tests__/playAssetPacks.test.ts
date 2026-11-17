import type { PlayAssetPacks } from '../storePackDelivery';

const NATIVE_MODULE_PATH = '../../../../modules/play-asset-delivery';
const STATE = {
  name: 'pack_german',
  status: 2,
  errorCode: 0,
  bytesDownloaded: 10,
  totalBytesToDownload: 100,
};

function loadWithNativeModule(nativeModule: unknown): PlayAssetPacks | null {
  let loaded: PlayAssetPacks | null = null;
  jest.isolateModules(() => {
    jest.doMock(NATIVE_MODULE_PATH, () => ({ PlayAssetDelivery: nativeModule }));
    loaded =
      jest.requireActual<typeof import('../playAssetPacks')>('../playAssetPacks').playAssetPacks;
  });
  return loaded;
}

function fakeNativeModule() {
  const subscription = { remove: jest.fn() };
  return {
    subscription,
    getPackStates: jest.fn(async () => [STATE]),
    fetch: jest.fn(async () => [STATE]),
    getAssetsPath: jest.fn(() => '/assets'),
    removePack: jest.fn(async () => {}),
    showConfirmationDialog: jest.fn(async () => true),
    addListener: jest.fn(() => subscription),
  };
}

afterEach(() => jest.dontMock(NATIVE_MODULE_PATH));

describe('playAssetPacks', () => {
  it('is null where the native module is not built in', () => {
    expect(loadWithNativeModule(null)).toBeNull();
  });

  it('passes calls through to the native module', async () => {
    const native = fakeNativeModule();
    const play = loadWithNativeModule(native);
    if (!play) throw new Error('Expected Play Asset Delivery to be available.');
    await expect(play.getPackStates(['pack_german'])).resolves.toEqual([STATE]);
    await expect(play.fetch(['pack_german'])).resolves.toEqual([STATE]);
    expect(play.getAssetsPath('pack_german')).toBe('/assets');
    await play.removePack('pack_german');
    await expect(play.showConfirmationDialog()).resolves.toBe(true);
    expect(native.getPackStates).toHaveBeenCalledWith(['pack_german']);
    expect(native.fetch).toHaveBeenCalledWith(['pack_german']);
    expect(native.removePack).toHaveBeenCalledWith('pack_german');
  });

  it('listens for state changes until told to stop', () => {
    const native = fakeNativeModule();
    const play = loadWithNativeModule(native);
    if (!play) throw new Error('Expected Play Asset Delivery to be available.');
    const listener = jest.fn();
    const stopListening = play.addStateListener(listener);
    expect(native.addListener).toHaveBeenCalledWith('onPackStateChanged', listener);
    expect(native.subscription.remove).not.toHaveBeenCalled();
    stopListening();
    expect(native.subscription.remove).toHaveBeenCalledTimes(1);
  });
});
