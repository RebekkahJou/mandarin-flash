import { TEST_PACK_METADATA } from '../../../data/testing/testPack';
import { PackRejectedError } from '../../../domain/packMetadata';
import {
  megabytesLabel,
  packFailureMessage,
  packInstalledMessage,
  packLanguageNames,
  storePackStatusText,
} from '../packMessages';
import { StorePackPhase } from '../storePackDelivery';

describe('pack messages', () => {
  it('shows rejection reasons as they are and hides unexpected errors', () => {
    expect(packFailureMessage(new PackRejectedError('Too old.'))).toBe('Too old.');
    expect(packFailureMessage(new Error('SQLITE_IOERR'))).toBe(
      'The language pack could not be installed. Please try again.',
    );
  });

  it('names the languages a pack serves', () => {
    expect(packLanguageNames({ ...TEST_PACK_METADATA, languageIds: ['zh-Hant', 'de'] })).toBe(
      'Mandarin (Traditional), de',
    );
  });

  it('says which pack was installed', () => {
    expect(packInstalledMessage({ ...TEST_PACK_METADATA, packVersion: 2 })).toBe(
      'The Mandarin pack (version 2) is installed. Mandarin (Traditional), Mandarin (Simplified) now use it.',
    );
  });
});

describe('store pack messages', () => {
  const progress = (phase: StorePackPhase, bytesDownloaded = 0, totalBytes = 16_400_000) => ({
    phase,
    bytesDownloaded,
    totalBytes,
  });

  it('rounds sizes to whole megabytes, at least 1', () => {
    expect(megabytesLabel(16_400_000)).toBe('16 MB');
    expect(megabytesLabel(200_000)).toBe('1 MB');
  });

  it('describes each download phase', () => {
    expect(storePackStatusText(progress(StorePackPhase.NotDownloaded))).toBe(
      '16 MB from Google Play.',
    );
    expect(storePackStatusText(progress(StorePackPhase.Downloading, 6_600_000))).toBe(
      'Downloading… 40%',
    );
    expect(storePackStatusText(progress(StorePackPhase.NeedsConfirmation))).toMatch(/Wi-Fi/);
    expect(storePackStatusText(progress(StorePackPhase.Downloaded))).toMatch(/Install/);
    expect(storePackStatusText(progress(StorePackPhase.Failed))).toMatch(/try again/);
  });

  it('shows 0% before Play knows the size', () => {
    expect(storePackStatusText(progress(StorePackPhase.Downloading, 0, 0))).toBe('Downloading… 0%');
  });
});
