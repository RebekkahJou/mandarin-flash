import { LANGUAGE_DEFINITIONS, LanguageId } from '../../domain/language';
import { toTaiwanTraditional } from '../chineseConverter';
import type { LanguageAdapter } from './languageAdapter';
import { MANDARIN_SHARED } from './mandarinShared';

export const mandarinTraditionalBundle: LanguageAdapter = {
  ...MANDARIN_SHARED,
  definition: LANGUAGE_DEFINITIONS[LanguageId.MandarinTraditional],
  // The Mandarin pack's headwords, readings and sentences are already Taiwan Traditional.
  dictionaryForm: { readsVariants: false, convertSentence: (text) => text },
  usesBundledFonts: true,
  normalizeHeadword: toTaiwanTraditional,
};
