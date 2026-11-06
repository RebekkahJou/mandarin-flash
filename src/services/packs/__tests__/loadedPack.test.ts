/**
 * @jest-environment node
 */
import { createInMemoryDatabase } from '../../../data/testing/nodeSqlDatabase';
import { TEST_PACK_METADATA } from '../../../data/testing/testPack';
import { LanguageId } from '../../../domain/language';
import type { LoadedPack } from '../loadedPack';
import { packForLanguage } from '../loadedPack';

function pack(packVersion: number, languageIds: string[], isBuiltIn = false): LoadedPack {
  return {
    metadata: { ...TEST_PACK_METADATA, packVersion, languageIds },
    database: createInMemoryDatabase(),
    isBuiltIn,
  };
}

describe('packForLanguage', () => {
  it('picks the newest pack serving the language', () => {
    const builtIn = pack(1, [LanguageId.MandarinTraditional, LanguageId.MandarinSimplified], true);
    const update = pack(2, [LanguageId.MandarinTraditional, LanguageId.MandarinSimplified]);
    expect(packForLanguage([builtIn, update], LanguageId.MandarinSimplified)).toBe(update);
    expect(packForLanguage([update, builtIn], LanguageId.MandarinSimplified)).toBe(update);
  });

  it('ignores packs for other languages', () => {
    const german = pack(5, ['de']);
    const mandarin = pack(1, [LanguageId.MandarinTraditional]);
    expect(packForLanguage([german, mandarin], LanguageId.MandarinTraditional)).toBe(mandarin);
    expect(packForLanguage([german], LanguageId.MandarinTraditional)).toBeUndefined();
  });
});
