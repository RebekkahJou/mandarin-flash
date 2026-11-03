import * as OpenCC from 'opencc-js/cn2t';

// 'twp' = Taiwan standard characters plus Taiwan phrasing (软件 → 軟體, 出租车 → 計程車).
const convertSimplifiedToTaiwan = OpenCC.Converter({ from: 'cn', to: 'twp' });

/** Converts any Simplified Chinese in the input to Taiwan Traditional. Traditional input is unchanged. */
export function toTaiwanTraditional(text: string): string {
  return convertSimplifiedToTaiwan(text.trim());
}

const HAN_CHARACTER_PATTERN = /\p{Script=Han}/u;

export function containsChineseCharacters(text: string): boolean {
  return HAN_CHARACTER_PATTERN.test(text);
}
