import { LanguageId } from '../../domain/language';
import type { LanguageAdapter } from './languageAdapter';
import { mandarinTraditionalBundle } from './mandarinTraditionalBundle';

export const LANGUAGE_BUNDLES: Readonly<Record<LanguageId, LanguageAdapter>> = {
  [LanguageId.MandarinTraditional]: mandarinTraditionalBundle,
};

export function languageBundleFor(languageId: LanguageId): LanguageAdapter {
  return LANGUAGE_BUNDLES[languageId];
}
