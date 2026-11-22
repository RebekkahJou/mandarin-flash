import type { WordRepository } from '../data/repositories/wordRepository';
import type { LanguageId } from '../domain/language';
import type { MatchKeys, SharedWordPair } from '../domain/sharedWords';
import { englishMeaningKeys, pairSharedWords } from '../domain/sharedWords';
import type { Word } from '../domain/word';
import type { LanguageAdapter } from './languages/languageAdapter';
import { languageBundleFor } from './languages/languageBundles';

/** A profile taking part in a game. */
export interface GameProfile {
  id: number;
  languageId: LanguageId;
}

function meaningKeys(word: Word): string[] {
  return englishMeaningKeys(word.definitions);
}

function matchKeysFor(adapter: LanguageAdapter, sharesScheme: boolean): MatchKeys<Word> {
  if (!sharesScheme) return meaningKeys;
  return (word) => [adapter.wordMatchKey(word.headword)];
}

/** The words both profiles study, each paired with the other profile's word for it. */
export async function loadSharedWords(
  first: GameProfile,
  second: GameProfile,
  wordRepository: Pick<WordRepository, 'listGameWords'>,
): Promise<SharedWordPair<Word>[]> {
  const firstAdapter = languageBundleFor(first.languageId);
  const secondAdapter = languageBundleFor(second.languageId);
  const sharesScheme = firstAdapter.wordMatchScheme === secondAdapter.wordMatchScheme;
  const [firstWords, secondWords] = await Promise.all([
    wordRepository.listGameWords(first.id),
    wordRepository.listGameWords(second.id),
  ]);
  return pairSharedWords(
    firstWords,
    secondWords,
    matchKeysFor(firstAdapter, sharesScheme),
    matchKeysFor(secondAdapter, sharesScheme),
  );
}
