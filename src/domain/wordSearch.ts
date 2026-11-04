import type { Word } from './word';

const TONE_NUMBERS_AND_SPACES = /[0-9\s]/g;
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lets "xuesheng", "xue sheng", "xué shēng" and "xue2 sheng1" all find the same word. */
function normalizePinyin(pinyin: string): string {
  return pinyin
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(TONE_NUMBERS_AND_SPACES, '')
    .toLowerCase();
}

/** True when the query appears in the characters, the pinyin (ignoring tones) or a meaning. */
export function matchesWordSearch(word: Word, query: string): boolean {
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery.length === 0) return true;
  const pinyinQuery = normalizePinyin(trimmedQuery);
  return (
    word.traditional.includes(trimmedQuery) ||
    (word.simplified?.includes(trimmedQuery) ?? false) ||
    (pinyinQuery.length > 0 && normalizePinyin(word.pinyin).includes(pinyinQuery)) ||
    word.definitions.some((meaning) => meaning.toLowerCase().includes(trimmedQuery))
  );
}
