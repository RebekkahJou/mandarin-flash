import { act, renderHook, waitFor } from '@testing-library/react-native';

import { TEST_PACK_METADATA } from '../../../data/testing/testPack';
import { STORE_PACKS } from '../../../domain/storePacks';
import type { LoadedPack } from '../../../services/packs/loadedPack';
import { playAssetPacks } from '../../../services/packs/playAssetPacks';
import type { AssetPackState, PlayAssetPacks } from '../../../services/packs/storePackDelivery';
import { AssetPackStatus } from '../../../services/packs/storePackDelivery';
import { showMessage } from '../../confirm';
import { useLanguagePacks } from '../../LanguagePacksContext';
import { useStorePacks } from '../useStorePacks';

jest.mock('../../../services/packs/playAssetPacks', () => ({
  playAssetPacks: {
    getPackStates: jest.fn(),
    fetch: jest.fn(),
    getAssetsPath: jest.fn(),
    removePack: jest.fn(),
    showConfirmationDialog: jest.fn(),
    addStateListener: jest.fn(),
  },
}));
jest.mock('../../confirm', () => ({ showMessage: jest.fn(), confirm: jest.fn() }));
jest.mock('../../LanguagePacksContext', () => ({ useLanguagePacks: jest.fn() }));

const play = playAssetPacks as jest.Mocked<PlayAssetPacks>;
const mockedUseLanguagePacks = jest.mocked(useLanguagePacks);
const mockedShowMessage = jest.mocked(showMessage);

// Development builds offer the test pack, so the catalog always has one pack here.
const STORE_PACK = STORE_PACKS[0];
const ASSETS_PATH = '/data/assetpacks/assets';
const TOTAL_BYTES = 16_400_000;

function state(status: AssetPackStatus, errorCode = 0): AssetPackState {
  return {
    name: STORE_PACK.assetPackName,
    status,
    errorCode,
    bytesDownloaded: 0,
    totalBytesToDownload: TOTAL_BYTES,
  };
}

function openPack(packVersion: number): LoadedPack {
  return {
    metadata: { ...TEST_PACK_METADATA, packId: STORE_PACK.packId, packVersion },
    database: {} as LoadedPack['database'],
    isBuiltIn: false,
    fonts: [],
  };
}

let sendState: (update: AssetPackState) => void = () => {};
const installPack = jest.fn();

function useLanguagePacksWith(packs: LoadedPack[]) {
  mockedUseLanguagePacks.mockReturnValue({ packs, installPack, removePack: jest.fn() });
}

beforeEach(() => {
  jest.clearAllMocks();
  useLanguagePacksWith([openPack(STORE_PACK.packVersion - 1)]);
  play.getPackStates.mockResolvedValue([state(AssetPackStatus.NotInstalled)]);
  play.fetch.mockResolvedValue([state(AssetPackStatus.Pending)]);
  play.getAssetsPath.mockReturnValue(ASSETS_PATH);
  play.removePack.mockResolvedValue();
  play.addStateListener.mockImplementation((listener) => {
    sendState = listener;
    return () => {};
  });
  installPack.mockResolvedValue(openPack(STORE_PACK.packVersion));
});

async function renderStorePacks() {
  const rendered = await renderHook(() => useStorePacks());
  await waitFor(() => expect(play.getPackStates).toHaveBeenCalled());
  return rendered;
}

describe('useStorePacks', () => {
  it('offers a store pack Play can deliver, with its size', async () => {
    const { result } = await renderStorePacks();
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    const [row] = result.current.rows;
    expect(row.title).toBe(STORE_PACK.title);
    expect(row.details).toMatch(/^16 MB from Google Play\. Mandarin \(Traditional\)/);
    expect(row.actionLabel).toBe('Get');
  });

  it('hides a store pack whose version, or a newer one, is already open', async () => {
    useLanguagePacksWith([openPack(STORE_PACK.packVersion + 1)]);
    const { result } = await renderHook(() => useStorePacks());
    expect(result.current.rows).toEqual([]);
    expect(play.getPackStates).not.toHaveBeenCalled();
  });

  it('hides store packs when Play cannot deliver them here', async () => {
    play.getPackStates.mockRejectedValue(new Error('Play error -15'));
    const { result } = await renderStorePacks();
    expect(result.current.rows).toEqual([]);
  });

  it('offers Install when Play already has the pack', async () => {
    play.getPackStates.mockResolvedValue([state(AssetPackStatus.Completed)]);
    const { result } = await renderStorePacks();
    await waitFor(() => expect(result.current.rows[0]?.actionLabel).toBe('Install'));
  });

  it('downloads, installs and then deletes Play’s copy', async () => {
    let finishInstall: (pack: LoadedPack) => void = () => {};
    installPack.mockReturnValue(new Promise((resolve) => (finishInstall = resolve)));
    const { result } = await renderStorePacks();
    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    let getting: Promise<void> = Promise.resolve();
    await act(async () => {
      getting = result.current.getPack(STORE_PACK);
    });
    expect(result.current.rows[0].actionLabel).toBeNull();
    expect(result.current.rows[0].details).toMatch(/^Downloading… 0%/);

    await act(async () => sendState(state(AssetPackStatus.Completed)));
    expect(installPack).toHaveBeenCalledWith(`file://${ASSETS_PATH}/${STORE_PACK.fileName}`);
    expect(result.current.rows[0].details).toMatch(/^Installing…/);

    await act(async () => {
      finishInstall(openPack(STORE_PACK.packVersion));
      await getting;
    });
    expect(play.removePack).toHaveBeenCalledWith(STORE_PACK.assetPackName);
    expect(mockedShowMessage).toHaveBeenCalledWith(
      'Pack installed',
      expect.stringContaining(`(version ${STORE_PACK.packVersion}) is installed`),
    );
  });

  it('explains a failed download and offers Get again', async () => {
    const { result } = await renderStorePacks();
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    let getting: Promise<void> = Promise.resolve();
    await act(async () => {
      getting = result.current.getPack(STORE_PACK);
    });
    await act(async () => {
      sendState(state(AssetPackStatus.Failed, -6));
      await getting;
    });
    expect(installPack).not.toHaveBeenCalled();
    expect(mockedShowMessage).toHaveBeenCalledWith(
      'Not installed',
      expect.stringMatching(/connection/),
    );
    expect(result.current.rows[0].actionLabel).toBe('Get');
  });
});
