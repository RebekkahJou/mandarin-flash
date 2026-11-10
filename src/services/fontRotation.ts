import type { RandomSource } from '../domain/random';
import { SUBSET_FONT_CHARACTERS } from './generated/fontCharacters';

/**
 * Font families used for the studied language on flashcards. The system font costs 0 MB;
 * the bundled ones are subset to common Traditional characters (see scripts/subset-fonts.py),
 * and language packs may bring fonts of their own. English text always uses the system sans-serif.
 */
export const SYSTEM_CHINESE_FONT = 'system';

const SUBSET_FONT_CHARACTER_SET: ReadonlySet<string> = new Set(SUBSET_FONT_CHARACTERS);

export const BUNDLED_CHINESE_FONTS = {
  NotoSerifTC: require('../../assets/fonts/NotoSerifTC-subset.otf') as number,
  LXGWWenKaiTC: require('../../assets/fonts/LXGWWenKaiTC-subset.ttf') as number,
  OpenHuninn: require('../../assets/fonts/OpenHuninn-subset.ttf') as number,
} as const;

/** A registered font family name: the system font, a bundled font or a pack's font. */
export type CardFontFamily = string;

const BUNDLED_FONT_NAMES: readonly string[] = Object.keys(BUNDLED_CHINESE_FONTS);

export const CHINESE_FONT_ROTATION: readonly CardFontFamily[] = [
  SYSTEM_CHINESE_FONT,
  ...BUNDLED_FONT_NAMES,
];

/**
 * The fonts a language's cards rotate through: the bundled Traditional fonts for languages that
 * use them, otherwise the system font plus any fonts the language's pack brought.
 */
export function cardFontRotation(
  usesBundledFonts: boolean,
  packFontFamilies: readonly CardFontFamily[],
): readonly CardFontFamily[] {
  if (usesBundledFonts) return CHINESE_FONT_ROTATION;
  return [SYSTEM_CHINESE_FONT, ...packFontFamilies];
}

/** Picks a random font from the rotation, never the same one twice in a row when there's a choice. */
export function pickNextCardFont(
  rotation: readonly CardFontFamily[],
  previousFont: CardFontFamily | undefined,
  random: RandomSource = Math.random,
): CardFontFamily {
  const choices = rotation.filter((font) => font !== previousFont);
  if (choices.length === 0) return rotation[0] ?? SYSTEM_CHINESE_FONT;
  return choices[Math.floor(random() * choices.length)];
}

/**
 * A bundled subset font may lack a rare character; such cards fall back to the system font.
 * Pack fonts are built to cover their language, and Android fills any gap from system fonts.
 */
export function fontForText(
  font: CardFontFamily,
  text: string,
  supportedCharacters: ReadonlySet<string> = SUBSET_FONT_CHARACTER_SET,
): CardFontFamily {
  if (!BUNDLED_FONT_NAMES.includes(font)) return font;
  const isFullySupported = [...text].every((character) => supportedCharacters.has(character));
  return isFullySupported ? font : SYSTEM_CHINESE_FONT;
}
