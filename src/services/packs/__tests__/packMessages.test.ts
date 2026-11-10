import { TEST_PACK_METADATA } from '../../../data/testing/testPack';
import { PackRejectedError } from '../../../domain/packMetadata';
import { packFailureMessage, packInstalledMessage, packLanguageNames } from '../packMessages';

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
