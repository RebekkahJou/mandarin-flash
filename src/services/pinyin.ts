/**
 * Pinyin is stored with tone numbers ("ni3 hao3", "lu:4"); these helpers convert it
 * for display (tone marks or Zhuyin) and normalize tone-marked input.
 */

const NEUTRAL_TONE = 5;
const SYLLABLE_PATTERN = /^([a-zü:]+)([1-5])?$/;

const TONE_MARKS: Readonly<Record<string, readonly string[]>> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

// prettier-ignore
const ZHUYIN_INITIALS: Readonly<Record<string, string>> = {
  b: 'ㄅ', p: 'ㄆ', m: 'ㄇ', f: 'ㄈ', d: 'ㄉ', t: 'ㄊ', n: 'ㄋ', l: 'ㄌ',
  g: 'ㄍ', k: 'ㄎ', h: 'ㄏ', j: 'ㄐ', q: 'ㄑ', x: 'ㄒ',
  zh: 'ㄓ', ch: 'ㄔ', sh: 'ㄕ', r: 'ㄖ', z: 'ㄗ', c: 'ㄘ', s: 'ㄙ',
};

// prettier-ignore
const ZHUYIN_FINALS: Readonly<Record<string, string>> = {
  a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ê: 'ㄝ', ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
  an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ', ong: 'ㄨㄥ', er: 'ㄦ',
  i: 'ㄧ', ia: 'ㄧㄚ', ie: 'ㄧㄝ', iao: 'ㄧㄠ', iu: 'ㄧㄡ', iou: 'ㄧㄡ', ian: 'ㄧㄢ',
  in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ', iong: 'ㄩㄥ', io: 'ㄧㄛ',
  u: 'ㄨ', ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', ui: 'ㄨㄟ', uei: 'ㄨㄟ', uan: 'ㄨㄢ',
  un: 'ㄨㄣ', uen: 'ㄨㄣ', uang: 'ㄨㄤ', ueng: 'ㄨㄥ',
  ü: 'ㄩ', üe: 'ㄩㄝ', üan: 'ㄩㄢ', ün: 'ㄩㄣ',
};

const ZHUYIN_TONE_MARKS = ['', 'ˊ', 'ˇ', 'ˋ'];
const ZHUYIN_NEUTRAL_TONE_MARK = '˙';

/** zhi, chi, shi, ri, zi, ci, si: the "i" is silent in Zhuyin. */
const SYLLABLES_WITH_SILENT_I = new Set(['zh', 'ch', 'sh', 'r', 'z', 'c', 's']);
const PALATAL_INITIALS = new Set(['j', 'q', 'x']);

interface ParsedSyllable {
  letters: string;
  tone: number;
}

function parseSyllable(syllable: string): ParsedSyllable | null {
  const normalized = syllable.toLowerCase().replace(/u:|v/g, 'ü');
  const match = SYLLABLE_PATTERN.exec(normalized);
  if (!match) return null;
  return { letters: match[1], tone: match[2] ? Number(match[2]) : NEUTRAL_TONE };
}

function mapSyllables(pinyin: string, convert: (parsed: ParsedSyllable) => string | null): string {
  return pinyin
    .trim()
    .split(/\s+/)
    .map((syllable) => {
      const parsed = parseSyllable(syllable);
      const converted = parsed && convert(parsed);
      if (!converted) return syllable;
      // Proper nouns in CC-CEDICT are capitalized ("Bei3 jing1"); keep that in the output.
      return isCapitalized(syllable) ? capitalize(converted) : converted;
    })
    .join(' ');
}

function isCapitalized(text: string): boolean {
  return text[0] !== text[0].toLowerCase();
}

function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

// ---------- Tone marks ----------

function vowelIndexForToneMark(letters: string): number {
  for (const preferredVowel of ['a', 'e']) {
    const index = letters.indexOf(preferredVowel);
    if (index >= 0) return index;
  }
  const ouIndex = letters.indexOf('ou');
  if (ouIndex >= 0) return ouIndex;
  let lastVowelIndex = -1;
  [...letters].forEach((letter, index) => {
    if (letter in TONE_MARKS) lastVowelIndex = index;
  });
  return lastVowelIndex;
}

function addToneMark({ letters, tone }: ParsedSyllable): string {
  if (tone === NEUTRAL_TONE) return letters;
  const vowelIndex = vowelIndexForToneMark(letters);
  if (vowelIndex < 0) return letters;
  const markedVowel = TONE_MARKS[letters[vowelIndex]][tone - 1];
  return letters.slice(0, vowelIndex) + markedVowel + letters.slice(vowelIndex + 1);
}

/** "ni3 hao3" → "nǐ hǎo" */
export function toToneMarkedPinyin(numberedPinyin: string): string {
  return mapSyllables(numberedPinyin, addToneMark);
}

const MARKED_VOWEL_LOOKUP: ReadonlyMap<string, { vowel: string; tone: number }> = new Map(
  Object.entries(TONE_MARKS).flatMap(([vowel, markedVowels]) =>
    markedVowels.map((markedVowel, index) => [markedVowel, { vowel, tone: index + 1 }] as const),
  ),
);

/** "nǐ hǎo" → "ni3 hao3"; already-numbered input passes through. Syllables must be space-separated. */
export function toNumberedPinyin(pinyin: string): string {
  return pinyin
    .trim()
    .split(/\s+/)
    .map((syllable) => {
      if (/[1-5]$/.test(syllable)) return syllable.toLowerCase();
      let tone = NEUTRAL_TONE;
      const plainLetters = [...syllable.toLowerCase()]
        .map((letter) => {
          const marked = MARKED_VOWEL_LOOKUP.get(letter);
          if (!marked) return letter;
          tone = marked.tone;
          return marked.vowel;
        })
        .join('')
        .replace(/ü/g, 'u:');
      return `${plainLetters}${tone}`;
    })
    .join(' ');
}

// ---------- Zhuyin ----------

function splitInitial(letters: string): { initial: string; final: string } {
  const twoLetterInitial = letters.slice(0, 2);
  if (twoLetterInitial in ZHUYIN_INITIALS) {
    return { initial: twoLetterInitial, final: letters.slice(2) };
  }
  const oneLetterInitial = letters.slice(0, 1);
  if (oneLetterInitial in ZHUYIN_INITIALS) {
    return { initial: oneLetterInitial, final: letters.slice(1) };
  }
  return { initial: '', final: letters };
}

/** Rewrites y/w spellings and j/q/x + u into the underlying final ("you" → "iou", "ju" → "jü"). */
function normalizeFinal(initial: string, final: string): string {
  if (PALATAL_INITIALS.has(initial)) return final.replace(/^u/, 'ü');
  if (final.startsWith('yu')) return `ü${final.slice(2)}`;
  if (final.startsWith('yi')) return `i${final.slice(2)}`;
  if (final.startsWith('y')) return `i${final.slice(1)}`;
  if (final.startsWith('wu')) return `u${final.slice(2)}`;
  if (final.startsWith('w')) return `u${final.slice(1)}`;
  return final;
}

function syllableToZhuyin({ letters, tone }: ParsedSyllable): string | null {
  if (letters === 'r') return addZhuyinTone('ㄦ', tone);
  const { initial, final } = splitInitial(letters);
  const isSilentI = final === 'i' && SYLLABLES_WITH_SILENT_I.has(initial);
  const finalZhuyin = isSilentI ? '' : ZHUYIN_FINALS[normalizeFinal(initial, final)];
  if (finalZhuyin === undefined) return null;
  return addZhuyinTone((ZHUYIN_INITIALS[initial] ?? '') + finalZhuyin, tone);
}

function addZhuyinTone(zhuyin: string, tone: number): string {
  if (tone === NEUTRAL_TONE) return ZHUYIN_NEUTRAL_TONE_MARK + zhuyin;
  return zhuyin + ZHUYIN_TONE_MARKS[tone - 1];
}

/** "ni3 hao3" → "ㄋㄧˇ ㄏㄠˇ". Unrecognized syllables are kept unchanged. */
export function toZhuyin(numberedPinyin: string): string {
  return mapSyllables(numberedPinyin, syllableToZhuyin);
}
