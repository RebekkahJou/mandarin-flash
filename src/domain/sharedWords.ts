/**
 * Shared words for games between two profiles: words both profiles study, paired by meaning.
 * How words are keyed (characters or English meaning) is decided by the caller.
 */
import type { Word } from './word';

/** What a game needs of a word. */
export type GameWord = Pick<Word, 'id' | 'headword' | 'reading' | 'definitions'>;

/** One word studied by both players: each player's own version of it. */
export interface SharedWordPair<PairedWord extends GameWord = GameWord> {
  first: PairedWord;
  second: PairedWord;
}

/** Turns a word into the keys it matches on; two words match when they share any key. */
export type MatchKeys<KeyedWord> = (word: KeyedWord) => readonly string[];

const BRACKETED_TEXT = /\([^)]*\)|\[[^\]]*\]|（[^）]*）/g;
const LEADING_FILLER_WORD = /^(to|a|an|the)\s+/;
const OUTER_PUNCTUATION = /^[\s.,!?;:'"…]+|[\s.,!?;:'"…]+$/g;
const MEANING_SEPARATOR = ';';
const WHITESPACE_RUN = /\s+/g;

function englishMeaningKey(meaning: string): string {
  return meaning
    .toLowerCase()
    .replace(BRACKETED_TEXT, ' ')
    .replace(WHITESPACE_RUN, ' ')
    .trim()
    .replace(LEADING_FILLER_WORD, '')
    .replace(OUTER_PUNCTUATION, '');
}

/** "To restart (a device)" and "restart" give the same key; "scam; fraud" gives two. */
export function englishMeaningKeys(definitions: readonly string[]): string[] {
  const meanings = definitions.flatMap((definition) => definition.split(MEANING_SEPARATOR));
  const keys = meanings.map(englishMeaningKey).filter((key) => key.length > 0);
  return [...new Set(keys)];
}

/**
 * Pairs each first-player word with an unused second-player word that shares a key. Each word is
 * paired at most once; first-player words are taken in order.
 */
export function pairSharedWords<PairedWord extends GameWord>(
  firstWords: readonly PairedWord[],
  secondWords: readonly PairedWord[],
  firstKeys: MatchKeys<PairedWord>,
  secondKeys: MatchKeys<PairedWord>,
): SharedWordPair<PairedWord>[] {
  const secondWordsByKey = new Map<string, PairedWord[]>();
  for (const word of secondWords) {
    for (const key of secondKeys(word)) {
      secondWordsByKey.set(key, [...(secondWordsByKey.get(key) ?? []), word]);
    }
  }
  const pairedSecondIds = new Set<number>();
  const pairs: SharedWordPair<PairedWord>[] = [];
  for (const first of firstWords) {
    const second = firstKeys(first)
      .flatMap((key) => secondWordsByKey.get(key) ?? [])
      .find((candidate) => !pairedSecondIds.has(candidate.id));
    if (!second) continue;
    pairedSecondIds.add(second.id);
    pairs.push({ first, second });
  }
  return pairs;
}
