// The full build (both directions) is the same size as the two one-way builds together.
import * as OpenCC from 'opencc-js';

// 'twp' = Taiwan standard characters plus Taiwan phrasing (软件 → 軟體, 出租车 → 計程車).
const convertSimplifiedToTaiwan = OpenCC.Converter({ from: 'cn', to: 'twp' });
// From 'twp' so Taiwan words become their mainland equivalents too (軟體 → 软件).
const convertTraditionalToMainland = OpenCC.Converter({ from: 'twp', to: 'cn' });

/** Converts any Simplified Chinese in the input to Taiwan Traditional. Traditional input is unchanged. */
export function toTaiwanTraditional(text: string): string {
  return convertSimplifiedToTaiwan(text.trim());
}

/** Converts any Traditional Chinese in the input to mainland Simplified. Simplified input is unchanged. */
export function toMainlandSimplified(text: string): string {
  return convertTraditionalToMainland(text.trim());
}

const HAN_CHARACTER_PATTERN = /\p{Script=Han}/u;

export function containsChineseCharacters(text: string): boolean {
  return HAN_CHARACTER_PATTERN.test(text);
}
