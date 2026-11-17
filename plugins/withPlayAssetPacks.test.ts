/**
 * @jest-environment node
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { StorePack } from './withPlayAssetPacks';
import {
  addAssetPacksToAppBuild,
  addAssetPacksToSettings,
  assetPackBuildGradle,
  storePacksToBundle,
} from './withPlayAssetPacks';

const GERMAN: StorePack = {
  assetPackName: 'pack_german',
  sourcePath: 'store/german.mfpack',
  fileName: 'german.mfpack',
  isTestPack: false,
};
const TEST_PACK: StorePack = {
  assetPackName: 'pack_test',
  sourcePath: 'store/test.mfpack',
  fileName: 'test.mfpack',
  isTestPack: true,
};

const SETTINGS = "rootProject.name = 'Mandarin Flash'\ninclude ':app'\n";
const APP_BUILD = 'apply plugin: "com.android.application"\n\nandroid {\n    ndkVersion "1"\n}\n';

describe('addAssetPacksToSettings', () => {
  it('includes each asset pack module', () => {
    const result = addAssetPacksToSettings(SETTINGS, [GERMAN, TEST_PACK]);
    expect(result).toContain("include ':app'");
    expect(result).toContain("include ':pack_german'\ninclude ':pack_test'");
  });

  it('replaces the block from an earlier run', () => {
    const once = addAssetPacksToSettings(SETTINGS, [GERMAN, TEST_PACK]);
    const twice = addAssetPacksToSettings(once, [GERMAN]);
    expect(twice).toBe(addAssetPacksToSettings(SETTINGS, [GERMAN]));
    expect(twice).not.toContain('pack_test');
  });

  it('removes the block when there are no packs', () => {
    const once = addAssetPacksToSettings(SETTINGS, [GERMAN]);
    expect(addAssetPacksToSettings(once, [])).toBe(SETTINGS);
  });
});

describe('addAssetPacksToAppBuild', () => {
  it('lists the asset packs inside the android block', () => {
    const result = addAssetPacksToAppBuild(APP_BUILD, [GERMAN, TEST_PACK]);
    expect(result).toMatch(/android \{\n.*\n {4}assetPacks = \[":pack_german", ":pack_test"\]\n/);
    expect(result).toContain('ndkVersion "1"');
  });

  it('is repeatable', () => {
    const once = addAssetPacksToAppBuild(APP_BUILD, [GERMAN]);
    expect(addAssetPacksToAppBuild(once, [GERMAN])).toBe(once);
  });

  it('leaves the file unchanged when there are no packs', () => {
    expect(addAssetPacksToAppBuild(APP_BUILD, [])).toBe(APP_BUILD);
  });

  it('fails clearly without an android block', () => {
    expect(() => addAssetPacksToAppBuild('apply plugin: "x"\n', [GERMAN])).toThrow(/android block/);
  });
});

describe('assetPackBuildGradle', () => {
  it('makes an on-demand asset pack with the pack name', () => {
    const gradle = assetPackBuildGradle(GERMAN);
    expect(gradle).toContain("id 'com.android.asset-pack'");
    expect(gradle).toContain('packName = "pack_german"');
    expect(gradle).toContain('deliveryType = "on-demand"');
  });
});

describe('storePacksToBundle', () => {
  let projectRoot: string;
  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);

  beforeEach(() => {
    projectRoot = mkdtempSync(path.join(tmpdir(), 'store-packs-'));
    mkdirSync(path.join(projectRoot, 'store'));
    warnings.length = 0;
  });

  afterEach(() => rmSync(projectRoot, { recursive: true, force: true }));

  const makeFile = (storePack: StorePack) =>
    writeFileSync(path.join(projectRoot, storePack.sourcePath), 'pack');

  it('bundles test packs only in development builds', () => {
    makeFile(GERMAN);
    makeFile(TEST_PACK);
    expect(storePacksToBundle([GERMAN, TEST_PACK], projectRoot, false, warn)).toEqual([
      GERMAN,
      TEST_PACK,
    ]);
    expect(storePacksToBundle([GERMAN, TEST_PACK], projectRoot, true, warn)).toEqual([GERMAN]);
  });

  it('skips a missing test pack file with a warning', () => {
    makeFile(GERMAN);
    expect(storePacksToBundle([GERMAN, TEST_PACK], projectRoot, false, warn)).toEqual([GERMAN]);
    expect(warnings).toEqual([expect.stringContaining('store/test.mfpack')]);
  });

  it('stops the build when a real pack file is missing', () => {
    expect(() => storePacksToBundle([GERMAN], projectRoot, true, warn)).toThrow(
      /store\/german.mfpack/,
    );
  });

  it('refuses an invalid asset pack name', () => {
    const badName = { ...GERMAN, assetPackName: 'pack-german' };
    expect(() => storePacksToBundle([badName], projectRoot, true, warn)).toThrow(/not a valid/);
  });
});
