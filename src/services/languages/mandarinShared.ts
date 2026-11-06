import { containsChineseCharacters } from '../chineseConverter';
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

/** What Traditional and Simplified Mandarin handle the same way: Han script and pinyin. */
export const MANDARIN_SHARED = {
  csvHeaders: { headword: 'character', meaning: 'meaning', reading: 'pinyin' },
  containsLanguageScript: containsChineseCharacters,
  normalizeReading: toNumberedPinyin,
  formatReading: toToneMarkedPinyin,
  readingSearchKey: pinyinSearchKey,
} satisfies Partial<LanguageAdapter>;
