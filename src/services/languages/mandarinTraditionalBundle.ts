import { LANGUAGE_DEFINITIONS, LanguageId } from '../../domain/language';
import { toTaiwanTraditional } from '../chineseConverter';
import { ChineseScript } from '../dictionaryLookup';
import type { LanguageAdapter } from './languageAdapter';
import { MANDARIN_SHARED } from './mandarinShared';

export const mandarinTraditionalBundle: LanguageAdapter = {
  ...MANDARIN_SHARED,
  definition: LANGUAGE_DEFINITIONS[LanguageId.MandarinTraditional],
  // The dictionary's sentences are already Taiwan Traditional.
  dictionaryForm: {
    script: ChineseScript.Traditional,
    usesMainlandReadings: false,
    convertSentence: (text) => text,
  },
  usesBundledFonts: true,
  normalizeHeadword: toTaiwanTraditional,
};
