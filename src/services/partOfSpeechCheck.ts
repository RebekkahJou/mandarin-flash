import type { WordList } from '../domain/wordList';
import { WordListKind } from '../domain/wordList';
import type { DictionaryEntry } from './dictionaryLookup';
import { findReading, partsOfSpeechOf } from './dictionaryLookup';

type LookUp = (headword: string) => Promise<DictionaryEntry[]>;

/**
 * Ids of words in a part-of-speech list that have no meaning of that type, e.g. nouns in Verbs.
 * Only the word's own reading counts, and words the dictionary doesn't know are never flagged.
 */
export async function findPartOfSpeechMismatches(
  list: WordList,
  lookUp: LookUp,
): Promise<Set<number>> {
  const mismatchedWordIds = new Set<number>();
  if (list.kind !== WordListKind.PartOfSpeech) return mismatchedWordIds;
  for (const { word } of list.words) {
    if (mismatchedWordIds.has(word.id)) continue;
    const reading = findReading(await lookUp(word.headword), word.reading);
    const partsOfSpeech = partsOfSpeechOf(reading ? [reading] : []);
    if (list.validateWord(partsOfSpeech) !== null) mismatchedWordIds.add(word.id);
  }
  return mismatchedWordIds;
}
