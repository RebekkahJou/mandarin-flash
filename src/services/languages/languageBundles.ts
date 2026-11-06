import { LanguageId } from '../../domain/language';
import type { LanguageAdapter } from './languageAdapter';
import { mandarinSimplifiedBundle } from './mandarinSimplifiedBundle';
import { mandarinTraditionalBundle } from './mandarinTraditionalBundle';

export const LANGUAGE_BUNDLES: Readonly<Record<LanguageId, LanguageAdapter>> = {
  [LanguageId.MandarinTraditional]: mandarinTraditionalBundle,
  [LanguageId.MandarinSimplified]: mandarinSimplifiedBundle,
};

export function languageBundleFor(languageId: LanguageId): LanguageAdapter {
  return LANGUAGE_BUNDLES[languageId];
}
