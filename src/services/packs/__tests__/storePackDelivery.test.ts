import { LanguageId } from '../../../domain/language';
import { PackRejectedError } from '../../../domain/packMetadata';
import type { StorePack } from '../../../domain/storePacks';
import type { AssetPackState, PlayAssetPacks, StorePackProgress } from '../storePackDelivery';
import {
  AssetPackErrorCode,
  AssetPackStatus,
  StorePackPhase,
  createStorePackDelivery,
  storePackFailureMessage,
  storePackProgress,
} from '../storePackDelivery';

const GERMAN: StorePack = {
  assetPackName: 'pack_german',
  sourcePath: 'dist/store-packs/german-v1.mfpack',
  fileName: 'german-v1.mfpack',
  packId: 'german',
  packVersion: 1,
  title: 'German',
  languageIds: [LanguageId.MandarinTraditional],
  isTestPack: false,
};
const ASSETS_PATH = '/data/user/0/app/files/assetpacks/pack_german/1/1/assets';
const TOTAL_BYTES = 1000;

function state(status: AssetPackStatus, overrides: Partial<AssetPackState> = {}): AssetPackState {
  return {
    name: GERMAN.assetPackName,
    status,
    errorCode: AssetPackErrorCode.NoError,
    bytesDownloaded: 0,
    totalBytesToDownload: TOTAL_BYTES,
    ...overrides,
  };
}

/** A Play that answers fetch with the given states and lets the test send later updates. */
function fakePlay(fetchStates: AssetPackState[] = [state(AssetPackStatus.Pending)]) {
  const listeners = new Set<(update: AssetPackState) => void>();
  let assetsPath: string | null = null;
  const play: jest.Mocked<PlayAssetPacks> = {
    getPackStates: jest.fn(async (_names: string[]) => [state(AssetPackStatus.NotInstalled)]),
    fetch: jest.fn(async (_names: string[]) => fetchStates),
    getAssetsPath: jest.fn((_name: string) => assetsPath),
    removePack: jest.fn(async (_name: string) => {}),
    showConfirmationDialog: jest.fn(async () => true),
    addStateListener: jest.fn((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };
  const send = (update: AssetPackState) => {
    if (update.status === AssetPackStatus.Completed) assetsPath = ASSETS_PATH;
    listeners.forEach((listener) => listener(update));
  };
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  return { play, send, flush, listenerCount: () => listeners.size };
}

describe('storePackProgress', () => {
  it.each([
    [AssetPackStatus.Unknown, StorePackPhase.Unavailable],
    [AssetPackStatus.Pending, StorePackPhase.Downloading],
    [AssetPackStatus.Downloading, StorePackPhase.Downloading],
    [AssetPackStatus.Transferring, StorePackPhase.Downloading],
    [AssetPackStatus.Completed, StorePackPhase.Downloaded],
    [AssetPackStatus.Failed, StorePackPhase.Failed],
    [AssetPackStatus.Canceled, StorePackPhase.NotDownloaded],
    [AssetPackStatus.WaitingForWifi, StorePackPhase.NeedsConfirmation],
    [AssetPackStatus.NotInstalled, StorePackPhase.NotDownloaded],
    [AssetPackStatus.RequiresUserConfirmation, StorePackPhase.NeedsConfirmation],
  ])('maps Play status %s to %s', (status, phase) => {
    expect(storePackProgress(state(status)).phase).toBe(phase);
  });

  it('treats a status Play may add later as unavailable', () => {
    expect(storePackProgress(state(42 as AssetPackStatus)).phase).toBe(StorePackPhase.Unavailable);
  });

  it('carries the download progress', () => {
    const progress = storePackProgress(
      state(AssetPackStatus.Downloading, { bytesDownloaded: 250 }),
    );
    expect(progress).toEqual({
      phase: StorePackPhase.Downloading,
      bytesDownloaded: 250,
      totalBytes: TOTAL_BYTES,
    });
  });
});

describe('storePackFailureMessage', () => {
  it('explains network and storage failures', () => {
    expect(storePackFailureMessage(AssetPackErrorCode.NetworkError)).toMatch(/connection/);
    expect(storePackFailureMessage(AssetPackErrorCode.InsufficientStorage)).toMatch(/space/);
    expect(storePackFailureMessage(-100)).toMatch(/try again later/);
  });
});

describe('readProgress', () => {
  it('reads every store pack from Play', async () => {
    const { play } = fakePlay();
    const progress = await createStorePackDelivery(play).readProgress([GERMAN]);
    expect(play.getPackStates).toHaveBeenCalledWith(['pack_german']);
    expect(progress.get('pack_german')?.phase).toBe(StorePackPhase.NotDownloaded);
  });

  it('marks every pack unavailable when Play cannot be asked', async () => {
    const { play } = fakePlay();
    play.getPackStates.mockRejectedValue(new Error('Play error -15'));
    const progress = await createStorePackDelivery(play).readProgress([GERMAN]);
    expect(progress.get('pack_german')?.phase).toBe(StorePackPhase.Unavailable);
  });

  it('does not ask Play when there are no store packs', async () => {
    const { play } = fakePlay();
    expect((await createStorePackDelivery(play).readProgress([])).size).toBe(0);
    expect(play.getPackStates).not.toHaveBeenCalled();
  });
});

describe('download', () => {
  it('reports progress and returns the downloaded file once Play has it', async () => {
    const { play, send, flush, listenerCount } = fakePlay();
    const updates: StorePackProgress[] = [];
    const result = createStorePackDelivery(play).download(GERMAN, (update) => updates.push(update));
    await flush();
    send(state(AssetPackStatus.Downloading, { bytesDownloaded: 500 }));
    send(state(AssetPackStatus.Completed, { bytesDownloaded: TOTAL_BYTES }));
    await expect(result).resolves.toBe(`file://${ASSETS_PATH}/german-v1.mfpack`);
    expect(updates.map((update) => update.phase)).toEqual([
      StorePackPhase.Downloading,
      StorePackPhase.Downloading,
      StorePackPhase.Downloaded,
    ]);
    expect(listenerCount()).toBe(0);
  });

  it('finishes at once when Play already has the pack', async () => {
    const { play, send } = fakePlay([]);
    play.fetch.mockImplementation(async () => {
      send(state(AssetPackStatus.Completed));
      return [state(AssetPackStatus.Completed)];
    });
    await expect(createStorePackDelivery(play).download(GERMAN, () => {})).resolves.toContain(
      ASSETS_PATH,
    );
  });

  it('ignores updates for other packs', async () => {
    const { play, send, flush } = fakePlay();
    const updates: StorePackProgress[] = [];
    const result = createStorePackDelivery(play).download(GERMAN, (update) => updates.push(update));
    await flush();
    send(state(AssetPackStatus.Failed, { name: 'pack_other' }));
    send(state(AssetPackStatus.Completed));
    await expect(result).resolves.toContain(ASSETS_PATH);
    expect(updates).toHaveLength(2);
  });

  it('fails with a message for the user when Play fails', async () => {
    const { play, send, flush, listenerCount } = fakePlay();
    const result = createStorePackDelivery(play).download(GERMAN, () => {});
    await flush();
    send(state(AssetPackStatus.Failed, { errorCode: AssetPackErrorCode.NetworkError }));
    await expect(result).rejects.toThrow(/connection/);
    await expect(result).rejects.toBeInstanceOf(PackRejectedError);
    expect(listenerCount()).toBe(0);
  });

  it('fails when Play refuses the request', async () => {
    const { play } = fakePlay();
    play.fetch.mockRejectedValue(new Error('Play error -2'));
    await expect(createStorePackDelivery(play).download(GERMAN, () => {})).rejects.toThrow(
      /could not download/,
    );
  });

  it('asks the user once when Play needs their OK, then keeps waiting', async () => {
    const { play, send, flush } = fakePlay([state(AssetPackStatus.RequiresUserConfirmation)]);
    const result = createStorePackDelivery(play).download(GERMAN, () => {});
    await flush();
    send(state(AssetPackStatus.WaitingForWifi));
    send(state(AssetPackStatus.Completed));
    await expect(result).resolves.toContain(ASSETS_PATH);
    expect(play.showConfirmationDialog).toHaveBeenCalledTimes(1);
  });

  it('stops when the user declines the download', async () => {
    const { play } = fakePlay([state(AssetPackStatus.RequiresUserConfirmation)]);
    play.showConfirmationDialog.mockResolvedValue(false);
    await expect(createStorePackDelivery(play).download(GERMAN, () => {})).rejects.toThrow(
      'The pack was not downloaded.',
    );
  });

  it('fails when Play says it finished but has no files', async () => {
    const { play } = fakePlay([state(AssetPackStatus.Completed)]);
    await expect(createStorePackDelivery(play).download(GERMAN, () => {})).rejects.toThrow(
      /could not be found/,
    );
  });
});

describe('discardDownload', () => {
  it("removes Play's copy and ignores a copy that is already gone", async () => {
    const { play } = fakePlay();
    const delivery = createStorePackDelivery(play);
    await delivery.discardDownload(GERMAN);
    expect(play.removePack).toHaveBeenCalledWith('pack_german');
    play.removePack.mockRejectedValue(new Error('gone'));
    await expect(delivery.discardDownload(GERMAN)).resolves.toBeUndefined();
  });
});
