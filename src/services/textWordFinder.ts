/**
 * Finds the dictionary words in pasted or shared text (later, text read from a photo), so the
 * user can pick which to add.
 */
import type { WordRepository } from '../data/repositories/wordRepository';
import { scriptRuns, splitIntoKnownWords, wordCandidates } from '../domain/textWordSplitting';
import type { ParsedCsv } from './csvImport';
import type { DictionaryEntry, DictionaryLookup } from './dictionaryLookup';
import type { LanguageAdapter } from './languages/languageAdapter';

/** Text is untrusted (it may be shared in from any app), so only its start is searched. */
export const MAX_SEARCHED_TEXT_LENGTH = 1000;

export interface TextWordFinderServices {
  profileId: number;
  languageBundle: Pick<LanguageAdapter, 'normalizeHeadword' | 'containsLanguageScript'>;
  dictionaryLookup: Pick<DictionaryLookup, 'findKnownWords' | 'lookUp'>;
  wordRepository: Pick<WordRepository, 'findWord'>;
}

export interface FoundWord {
  /** The word's most common reading, with its meanings. */
  entry: DictionaryEntry;
  /** True when the profile already has the word with this reading. */
  isInProfile: boolean;
}

export interface TextWordSearch {
  /** In the order they first appear in the text. */
  words: FoundWord[];
  /** Characters of the script that are in no dictionary word. */
  unknownCharacters: string[];
  /** True when the text was longer than MAX_SEARCHED_TEXT_LENGTH and only its start was searched. */
  wasShortened: boolean;
}

export async function findWordsInText(
  services: TextWordFinderServices,
  text: string,
): Promise<TextWordSearch> {
  const { profileId, languageBundle, dictionaryLookup, wordRepository } = services;
  const characters = Array.from(text);
  const wasShortened = characters.length > MAX_SEARCHED_TEXT_LENGTH;
  const searchedText = characters.slice(0, MAX_SEARCHED_TEXT_LENGTH).join('');
  // Converts the whole text at once, so phrases convert as phrases (出租车 → 計程車).
  const normalizedText = languageBundle.normalizeHeadword(searchedText);
  const runs = scriptRuns(normalizedText, languageBundle.containsLanguageScript);
  const knownWords = await dictionaryLookup.findKnownWords(wordCandidates(runs));
  const split = splitIntoKnownWords(runs, knownWords);
  const words: FoundWord[] = [];
  for (const headword of split.words) {
    const [entry] = await dictionaryLookup.lookUp(headword);
    if (!entry) continue;
    const existing = await wordRepository.findWord(profileId, entry.headword, entry.reading);
    words.push({ entry, isInProfile: existing !== null });
  }
  return { words, unknownCharacters: split.unknownCharacters, wasShortened };
}

/** The chosen words in CSV import's form, so they are added the same way, as new words. */
export function foundWordsToImportRows(
  entries: readonly DictionaryEntry[],
  addedAtMs: number,
): ParsedCsv {
  return {
    rows: entries.map((entry, index) => ({
      rowNumber: index + 1,
      headword: entry.headword,
      meanings: [],
      reading: entry.reading,
      addedAtMs,
    })),
    invalidRowNumbers: [],
  };
}
