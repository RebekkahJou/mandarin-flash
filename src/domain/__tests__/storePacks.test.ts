import { LanguageId } from '../language';
import type { StorePack } from '../storePacks';
import {
  ASSET_PACK_NAME_PATTERN,
  STORE_PACKS,
  isStorePackInstalled,
  storePacksForBuild,
} from '../storePacks';

function storePack(overrides: Partial<StorePack> = {}): StorePack {
  return {
    assetPackName: 'pack_german',
    sourcePath: 'dist/store-packs/german-v1.mfpack',
    fileName: 'german-v1.mfpack',
    packId: 'german',
    packVersion: 1,
    title: 'German',
    languageIds: [LanguageId.MandarinTraditional],
    isTestPack: false,
    ...overrides,
  };
}

describe('STORE_PACKS', () => {
  it('uses valid asset pack names, each once', () => {
    const names = STORE_PACKS.map((entry) => entry.assetPackName);
    expect(names.every((name) => ASSET_PACK_NAME_PATTERN.test(name))).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  it('keeps only language ids the app knows', () => {
    for (const entry of STORE_PACKS) {
      expect(entry.languageIds.length).toBeGreaterThan(0);
    }
  });
});

describe('ASSET_PACK_NAME_PATTERN', () => {
  it.each(['pack_mandarin', 'German2'])('accepts %s', (name) => {
    expect(ASSET_PACK_NAME_PATTERN.test(name)).toBe(true);
  });

  it.each(['2pack', 'pack-mandarin', '', '_pack'])('refuses "%s"', (name) => {
    expect(ASSET_PACK_NAME_PATTERN.test(name)).toBe(false);
  });
});

describe('storePacksForBuild', () => {
  const realPack = storePack();
  const testPack = storePack({ assetPackName: 'pack_test', isTestPack: true });

  it('includes test packs in development builds', () => {
    expect(storePacksForBuild([realPack, testPack], true)).toEqual([realPack, testPack]);
  });

  it('leaves test packs out of release builds', () => {
    expect(storePacksForBuild([realPack, testPack], false)).toEqual([realPack]);
  });
});

describe('isStorePackInstalled', () => {
  const german = storePack({ packVersion: 2 });

  it('is installed when the same or a newer version is open', () => {
    expect(isStorePackInstalled(german, [{ packId: 'german', packVersion: 2 }])).toBe(true);
    expect(isStorePackInstalled(german, [{ packId: 'german', packVersion: 3 }])).toBe(true);
  });

  it('is not installed when only an older version or other packs are open', () => {
    expect(isStorePackInstalled(german, [{ packId: 'german', packVersion: 1 }])).toBe(false);
    expect(isStorePackInstalled(german, [{ packId: 'mandarin', packVersion: 5 }])).toBe(false);
  });
});
