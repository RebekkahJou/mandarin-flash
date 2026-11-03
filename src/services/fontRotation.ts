import type { RandomSource } from '../domain/random';
import { SUBSET_FONT_CHARACTERS } from './generated/fontCharacters';

/**
 * Font families used for Chinese characters on flashcards. The system font costs 0 MB;
 * the bundled ones are subset to common Traditional characters (see scripts/subset-fonts.py).
 * English text always uses the system sans-serif.
 */
export const SYSTEM_CHINESE_FONT = 'system';

const SUBSET_FONT_CHARACTER_SET: ReadonlySet<string> = new Set(SUBSET_FONT_CHARACTERS);

export const BUNDLED_CHINESE_FONTS = {
  NotoSerifTC: require('../../assets/fonts/NotoSerifTC-subset.otf') as number,
  LXGWWenKaiTC: require('../../assets/fonts/LXGWWenKaiTC-subset.ttf') as number,
  OpenHuninn: require('../../assets/fonts/OpenHuninn-subset.ttf') as number,
} as const;

export type ChineseFontFamily = keyof typeof BUNDLED_CHINESE_FONTS | typeof SYSTEM_CHINESE_FONT;

export const CHINESE_FONT_ROTATION: readonly ChineseFontFamily[] = [
  SYSTEM_CHINESE_FONT,
  ...(Object.keys(BUNDLED_CHINESE_FONTS) as (keyof typeof BUNDLED_CHINESE_FONTS)[]),
];

/** Picks a random font, never the same one twice in a row. */
export function pickNextChineseFont(
  previousFont: ChineseFontFamily | undefined,
  random: RandomSource = Math.random,
): ChineseFontFamily {
  const choices = CHINESE_FONT_ROTATION.filter((font) => font !== previousFont);
  return choices[Math.floor(random() * choices.length)];
}

/** A subset font may lack a rare character; such cards fall back to the system font. */
export function fontForText(
  font: ChineseFontFamily,
  text: string,
  supportedCharacters: ReadonlySet<string> = SUBSET_FONT_CHARACTER_SET,
): ChineseFontFamily {
  if (font === SYSTEM_CHINESE_FONT) return font;
  const isFullySupported = [...text].every((character) => supportedCharacters.has(character));
  return isFullySupported ? font : SYSTEM_CHINESE_FONT;
}
