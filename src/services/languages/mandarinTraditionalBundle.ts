import { LANGUAGE_DEFINITIONS, LanguageId } from '../../domain/language';
import { containsChineseCharacters, toTaiwanTraditional } from '../chineseConverter';
import { toNumberedPinyin, toToneMarkedPinyin } from '../pinyin';
import type { LanguageAdapter } from './languageAdapter';

const TONE_NUMBERS_AND_SPACES = /[0-9\s]/g;
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lets "xuesheng", "xue sheng", "xué shēng" and "xue2 sheng1" all find the same word. */
function pinyinSearchKey(pinyin: string): string {
  return pinyin
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(TONE_NUMBERS_AND_SPACES, '')
    .toLowerCase();
}

export const mandarinTraditionalBundle: LanguageAdapter = {
  definition: LANGUAGE_DEFINITIONS[LanguageId.MandarinTraditional],
  csvHeaders: { headword: 'character', meaning: 'meaning', reading: 'pinyin' },
  normalizeHeadword: toTaiwanTraditional,
  containsLanguageScript: containsChineseCharacters,
  normalizeReading: toNumberedPinyin,
  formatReading: toToneMarkedPinyin,
  readingSearchKey: pinyinSearchKey,
};
