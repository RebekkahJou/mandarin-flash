import { LANGUAGE_DEFINITIONS, LanguageId } from '../../domain/language';
import { toMainlandSimplified } from '../chineseConverter';
import { ChineseScript } from '../dictionaryLookup';
import type { LanguageAdapter } from './languageAdapter';
import { MANDARIN_SHARED } from './mandarinShared';

export const mandarinSimplifiedBundle: LanguageAdapter = {
  ...MANDARIN_SHARED,
  definition: LANGUAGE_DEFINITIONS[LanguageId.MandarinSimplified],
  dictionaryForm: {
    script: ChineseScript.Simplified,
    usesMainlandReadings: true,
    convertSentence: toMainlandSimplified,
  },
  // The bundled fonts are Traditional subsets; Simplified cards use the system font until a
  // pack brings Simplified fonts.
  usesBundledFonts: false,
  normalizeHeadword: toMainlandSimplified,
};
