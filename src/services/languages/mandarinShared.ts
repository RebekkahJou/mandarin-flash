import { containsChineseCharacters, toTaiwanTraditional } from '../chineseConverter';
import { toNumberedPinyin, toToneMarkedPinyin } from '../pinyin';
import type { LanguageAdapter } from './languageAdapter';

/** Both Mandarin variants write the same words in Han characters, so they match by characters. */
const HAN_CHARACTERS_MATCH_SCHEME = 'han-characters';

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
  csvHeaders: { headword: 'character', meaning: 'meaning', reading: 'pinyin', added: 'added' },
  containsLanguageScript: containsChineseCharacters,
  normalizeReading: toNumberedPinyin,
  formatReading: toToneMarkedPinyin,
  readingSearchKey: pinyinSearchKey,
  wordMatchScheme: HAN_CHARACTERS_MATCH_SCHEME,
  // Taiwan Traditional, so 老师 and 老師 match (readings may differ between Taiwan and mainland).
  wordMatchKey: toTaiwanTraditional,
} satisfies Partial<LanguageAdapter>;
