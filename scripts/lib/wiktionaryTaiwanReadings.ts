import { toZhuyin } from '../../src/services/pinyin';

/**
 * Reads Taiwan and mainland Mandarin readings from Wiktionary's Chinese entries, as extracted by
 * kaikki.org (one JSON object per line). Wiktionary lists both when they differ, tagged "Taiwan"
 * and "Mainland-China", in Bopomofo with one syllable per space, which splits words reliably.
 * The dump is untrusted input: every value is type-checked and nothing is evaluated.
 */

/** A word read differently in Taiwan and on the mainland, in numbered pinyin. */
export interface TaiwanReadingPair {
  headword: string;
  mainlandReading: string;
  taiwanReading: string;
}

interface WiktionarySound {
  zhuyin: string;
  tags: readonly string[];
}

const TONES = [1, 2, 3, 4, 5];
const MAX_LINE_LENGTH = 2_000_000;
const MAX_HEADWORD_LENGTH = 20;
/**
 * Character pages list many readings, so pairing them by position goes wrong (吃 "eat" paired
 * with the stutter reading jí). Single characters keep CC-CEDICT's own Taiwan readings.
 */
const MIN_HEADWORD_LENGTH = 2;
const HAN_CHARACTER = /^\p{Script=Han}$/u;
const TONELESS_VARIANT_TAG = 'toneless-final-syllable-variant';
const VARIANT_TAG = 'variant';
const ERHUA_TAG_PATTERN = /erhua/i;

/**
 * Maps each Bopomofo syllable (with tone mark) to numbered pinyin, from the pinyin syllables the
 * dictionary uses, by running the app's own pinyin → zhuyin conversion backwards.
 */
export function createZhuyinReader(syllableBases: Iterable<string>) {
  const pinyinByZhuyin = new Map<string, string>();
  for (const base of syllableBases) {
    for (const tone of TONES) {
      const pinyin = `${base}${tone}`;
      const zhuyin = toZhuyin(pinyin);
      if (zhuyin !== pinyin && !pinyinByZhuyin.has(zhuyin)) pinyinByZhuyin.set(zhuyin, pinyin);
    }
  }
  /** "ㄒㄧㄡ ㄒㄧˊ" → "xiu1 xi2"; null when a syllable isn't recognized. */
  return function zhuyinToPinyin(zhuyin: string): string | null {
    const syllables = zhuyin.trim().split(/\s+/);
    const pinyin = syllables.map((syllable) => pinyinByZhuyin.get(syllable) ?? null);
    return pinyin.every((syllable) => syllable !== null) ? pinyin.join(' ') : null;
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Standard Mandarin Bopomofo sounds of an entry, in page order, without erhua forms. */
function bopomofoSounds(sounds: unknown): WiktionarySound[] {
  if (!Array.isArray(sounds)) return [];
  return sounds.flatMap((sound: unknown) => {
    if (typeof sound !== 'object' || sound === null) return [];
    const { zh_pron: zhuyin, tags, raw_tags: rawTags } = sound as Record<string, unknown>;
    if (typeof zhuyin !== 'string' || !isStringArray(tags)) return [];
    const allTags = [...tags, ...(isStringArray(rawTags) ? rawTags : [])];
    const isStandard = allTags.includes('Standard-Chinese') && allTags.includes('Bopomofo');
    if (!isStandard || allTags.some((tag) => ERHUA_TAG_PATTERN.test(tag))) return [];
    return [{ zhuyin, tags: allTags }];
  });
}

const isMainland = (sound: WiktionarySound) =>
  sound.tags.includes('Mainland-China') || sound.tags.includes('mainland China');
const isTonelessVariant = (sound: WiktionarySound) => sound.tags.includes(TONELESS_VARIANT_TAG);
/** Taiwan's standard reading; "Taiwan, variant" marks the mainland one also heard in Taiwan. */
const isTaiwanStandard = (sound: WiktionarySound) =>
  sound.tags.includes('Taiwan') && !sound.tags.includes(VARIANT_TAG) && !isTonelessVariant(sound);
const hasRegion = (sound: WiktionarySound) => isMainland(sound) || sound.tags.includes('Taiwan');

/**
 * Pairs each reading CC-CEDICT may hold with the one Taiwan uses, as [other, Taiwan]:
 * - a Taiwan standard reading with the mainland one listed just before it (休息 xiū xi / xiū xí;
 *   衣服, where the mainland reading is tagged "Taiwan, variant");
 * - a toneless-final variant with the standard reading both regions share, listed just before it
 *   (護士 hù shi / hù shì), since CC-CEDICT often stores the toneless form.
 * Pairing with the reading just before keeps words with one pronunciation per meaning apart.
 */
function pairSounds(sounds: readonly WiktionarySound[]): [string, string][] {
  const pairs: [string, string][] = [];
  let lastMainland: WiktionarySound | null = null;
  let lastShared: WiktionarySound | null = null;
  for (const sound of sounds) {
    if (isTaiwanStandard(sound) && lastMainland) {
      pairs.push([lastMainland.zhuyin, sound.zhuyin]);
      lastMainland = null;
    } else if (isTonelessVariant(sound) && !hasRegion(sound) && lastShared) {
      pairs.push([sound.zhuyin, lastShared.zhuyin]);
      lastShared = null;
    } else if (isMainland(sound) && !isTonelessVariant(sound)) {
      lastMainland = sound;
    } else if (!hasRegion(sound) && !isTonelessVariant(sound)) {
      lastShared = sound;
    }
  }
  return pairs;
}

function parseEntry(line: string): { word: string; sounds: unknown } | null {
  if (line.length > MAX_LINE_LENGTH) return null;
  try {
    const entry: unknown = JSON.parse(line);
    if (typeof entry !== 'object' || entry === null) return null;
    const { word, sounds } = entry as Record<string, unknown>;
    return typeof word === 'string' ? { word, sounds } : null;
  } catch {
    return null;
  }
}

/** A word's Taiwan/mainland pairs where the readings differ; one syllable per character. */
export function taiwanReadingPairsFromLine(
  line: string,
  zhuyinToPinyin: (zhuyin: string) => string | null,
): TaiwanReadingPair[] {
  const entry = parseEntry(line);
  if (!entry) return [];
  const characters = Array.from(entry.word);
  const isHanWord =
    characters.length >= MIN_HEADWORD_LENGTH &&
    characters.length <= MAX_HEADWORD_LENGTH &&
    characters.every((character) => HAN_CHARACTER.test(character));
  if (!isHanWord) return [];
  return pairSounds(bopomofoSounds(entry.sounds)).flatMap(([mainlandZhuyin, taiwanZhuyin]) => {
    const mainlandReading = zhuyinToPinyin(mainlandZhuyin);
    const taiwanReading = zhuyinToPinyin(taiwanZhuyin);
    if (!mainlandReading || !taiwanReading || mainlandReading === taiwanReading) return [];
    const hasOneSyllablePerCharacter =
      taiwanReading.split(' ').length === characters.length &&
      mainlandReading.split(' ').length === characters.length;
    if (!hasOneSyllablePerCharacter) return [];
    return [{ headword: entry.word, mainlandReading, taiwanReading }];
  });
}
