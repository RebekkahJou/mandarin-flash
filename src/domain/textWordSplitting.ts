/**
 * Splits text written without spaces (such as Chinese) into dictionary words, taking the longest
 * known word at each position.
 */

/** Longer runs are rare in the dictionary and would multiply the lookups. */
export const MAX_FOUND_WORD_LENGTH = 8;

export interface TextWordSplit {
  /** Each known word once, in the order it first appears. */
  words: string[];
  /** Characters of the script that start no known word, each once. */
  unknownCharacters: string[];
}

/** Stretches of consecutive script characters, each as an array of characters. */
export function scriptRuns(
  text: string,
  isScriptCharacter: (character: string) => boolean,
): string[][] {
  const runs: string[][] = [];
  let currentRun: string[] = [];
  for (const character of Array.from(text)) {
    if (isScriptCharacter(character)) {
      currentRun.push(character);
      continue;
    }
    if (currentRun.length > 0) runs.push(currentRun);
    currentRun = [];
  }
  if (currentRun.length > 0) runs.push(currentRun);
  return runs;
}

/** Every substring of each run up to the longest word length: what the dictionary is asked. */
export function wordCandidates(runs: readonly (readonly string[])[]): Set<string> {
  const candidates = new Set<string>();
  for (const run of runs) {
    for (let start = 0; start < run.length; start++) {
      const longestEnd = Math.min(run.length, start + MAX_FOUND_WORD_LENGTH);
      for (let end = start + 1; end <= longestEnd; end++) {
        candidates.add(run.slice(start, end).join(''));
      }
    }
  }
  return candidates;
}

function longestKnownWordAt(
  run: readonly string[],
  start: number,
  knownWords: ReadonlySet<string>,
): string | null {
  const longestEnd = Math.min(run.length, start + MAX_FOUND_WORD_LENGTH);
  for (let end = longestEnd; end > start; end--) {
    const candidate = run.slice(start, end).join('');
    if (knownWords.has(candidate)) return candidate;
  }
  return null;
}

export function splitIntoKnownWords(
  runs: readonly (readonly string[])[],
  knownWords: ReadonlySet<string>,
): TextWordSplit {
  const words = new Set<string>();
  const unknownCharacters = new Set<string>();
  for (const run of runs) {
    let position = 0;
    while (position < run.length) {
      const word = longestKnownWordAt(run, position, knownWords);
      if (word) {
        words.add(word);
        position += Array.from(word).length;
        continue;
      }
      unknownCharacters.add(run[position]);
      position++;
    }
  }
  return { words: [...words], unknownCharacters: [...unknownCharacters] };
}
