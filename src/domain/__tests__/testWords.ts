import { FrequencyTier } from '../frequencyTier';
import type { Word } from '../word';

export function makeWord(id: number, overrides: Partial<Word> = {}): Word {
  return {
    id,
    profileId: 1,
    traditional: `字${id}`,
    pinyin: 'zi4',
    definitions: [`meaning ${id}`],
    frequencyTier: FrequencyTier.HighIncidence,
    ...overrides,
  };
}

export function makeWordsInTier(count: number, tier: FrequencyTier, firstId: number): Word[] {
  return Array.from({ length: count }, (_, index) =>
    makeWord(firstId + index, { frequencyTier: tier }),
  );
}

/** Deterministic pseudo-random source (mulberry32) for repeatable tests. */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
