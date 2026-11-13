import { PartOfSpeech } from './partOfSpeech';

/**
 * Splitting a compound into its characters, for languages whose characters carry meaning alone
 * (Mandarin; later Japanese kanji). Offered for nouns, e.g. 雜貨店 → 雜, 貨, 店.
 */

/** A character of a compound, with where it first appears (stored in word_parts.position). */
export interface CompoundCharacter {
  character: string;
  position: number;
}

/**
 * The distinct characters of a multi-character word, in order of first appearance, keeping only
 * the language's own script (媽媽 → 媽; punctuation and Latin letters are left out).
 */
export function distinctCharacters(
  headword: string,
  isLanguageCharacter: (character: string) => boolean,
): CompoundCharacter[] {
  const characters = Array.from(headword);
  if (characters.length < 2) return [];
  const seen = new Set<string>();
  return characters.flatMap((character, position) => {
    if (seen.has(character) || !isLanguageCharacter(character)) return [];
    seen.add(character);
    return [{ character, position }];
  });
}

/** Whether to offer splitting a newly added word: a multi-character noun in a splitting language. */
export function shouldOfferCharacterSplit(
  splitsCompoundsIntoCharacters: boolean,
  headword: string,
  wordPartsOfSpeech: readonly PartOfSpeech[],
): boolean {
  return (
    splitsCompoundsIntoCharacters &&
    Array.from(headword).length > 1 &&
    wordPartsOfSpeech.includes(PartOfSpeech.Noun)
  );
}
