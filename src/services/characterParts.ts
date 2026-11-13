import type { WordListRepository } from '../data/repositories/wordListRepository';
import type { WordRepository } from '../data/repositories/wordRepository';
import { distinctCharacters } from '../domain/compoundSplitting';
import { defaultListIdsForNewWords } from '../domain/defaultWordLists';
import type { Word } from '../domain/word';
import { firstMeanings } from '../domain/wordList';
import type { DictionaryEntry } from './dictionaryLookup';

export interface CharacterPartServices {
  profileId: number;
  isLanguageCharacter: (character: string) => boolean;
  lookUp: (headword: string) => Promise<DictionaryEntry[]>;
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
}

/** One distinct character of a compound: already studied, or addable from the dictionary. */
export interface CharacterPart {
  character: string;
  position: number;
  /** The most common reading, used when the character is added. */
  entry?: DictionaryEntry;
  /** The profile's word for this character, when it already has one. */
  existingWord?: Word;
}

export interface CompoundParts {
  compoundWordId: number;
  parts: CharacterPart[];
}

/** Characters of a compound the profile has or the dictionary knows; others are left out. */
export async function findCharacterParts(
  services: CharacterPartServices,
  headword: string,
): Promise<CharacterPart[]> {
  const parts: CharacterPart[] = [];
  const characters = distinctCharacters(headword, services.isLanguageCharacter);
  for (const { character, position } of characters) {
    const existingWord =
      (await services.wordRepository.findWordByHeadword(services.profileId, character)) ??
      undefined;
    const [entry] = existingWord ? [] : await services.lookUp(character);
    if (existingWord || entry) parts.push({ character, position, entry, existingWord });
  }
  return parts;
}

export function partsToAdd(parts: readonly CharacterPart[]): CharacterPart[] {
  return parts.filter((part) => !part.existingWord);
}

async function generalVocabularyListId(services: CharacterPartServices): Promise<number | null> {
  const summaries = await services.wordListRepository.listSummaries(services.profileId);
  const [listId] = defaultListIdsForNewWords(summaries.map(({ list }) => list));
  return listId ?? null;
}

/** The part's word, creating it in General Vocabulary with its dictionary meanings if needed. */
async function wordForPart(
  services: CharacterPartServices,
  entry: DictionaryEntry,
  generalListId: number | null,
): Promise<{ word: Word; isNew: boolean }> {
  const { profileId, wordRepository, wordListRepository } = services;
  // Another compound in the same batch may have added this character already.
  const existing = await wordRepository.findWord(profileId, entry.headword, entry.reading);
  if (existing) return { word: existing, isNew: false };
  const word = await wordRepository.findOrCreateWord({
    profileId,
    headword: entry.headword,
    variant: entry.variant,
    reading: entry.reading,
    definitions: firstMeanings(entry.definitionCandidates),
  });
  if (generalListId !== null) {
    await wordListRepository.addWordToLists(word.id, [{ wordListId: generalListId }]);
  }
  return { word, isNew: true };
}

/**
 * Adds the chosen characters of each compound to General Vocabulary and links every character the
 * profile has to its compound. Returns the newly added words.
 */
export async function addCharacterParts(
  services: CharacterPartServices,
  compounds: readonly CompoundParts[],
  chosenCharacters: ReadonlySet<string>,
): Promise<Word[]> {
  const generalListId = await generalVocabularyListId(services);
  const addedWords: Word[] = [];
  for (const { compoundWordId, parts } of compounds) {
    const links: { position: number; partWordId: number }[] = [];
    for (const part of parts) {
      if (part.existingWord) {
        links.push({ position: part.position, partWordId: part.existingWord.id });
        continue;
      }
      if (!part.entry || !chosenCharacters.has(part.character)) continue;
      const { word, isNew } = await wordForPart(services, part.entry, generalListId);
      if (isNew) addedWords.push(word);
      links.push({ position: part.position, partWordId: word.id });
    }
    await services.wordRepository.linkWordParts(compoundWordId, links);
  }
  return addedWords;
}

/** For bulk adds: each noun compound's parts, and the distinct characters that would be added. */
export async function findBulkCharacterParts(
  services: CharacterPartServices,
  compounds: readonly Pick<Word, 'id' | 'headword'>[],
): Promise<{ compounds: CompoundParts[]; newCharacters: Set<string> }> {
  const found: CompoundParts[] = [];
  const newCharacters = new Set<string>();
  for (const compound of compounds) {
    const parts = await findCharacterParts(services, compound.headword);
    if (parts.length === 0) continue;
    found.push({ compoundWordId: compound.id, parts });
    for (const part of partsToAdd(parts)) newCharacters.add(part.character);
  }
  return { compounds: found, newCharacters };
}

/** "雜 zá: mixed", shown next to a character's checkbox. */
export function characterPartLabel(
  part: CharacterPart,
  formatReading: (reading: string) => string,
): string {
  if (!part.entry) return part.character;
  const [firstMeaning] = firstMeanings(part.entry.definitionCandidates);
  const reading = `${part.character} ${formatReading(part.entry.reading)}`;
  return firstMeaning ? `${reading}: ${firstMeaning}` : reading;
}

/** "店 is already in your words." Null when no character is. */
export function alreadyAddedNote(parts: readonly CharacterPart[]): string | null {
  const existing = parts.filter((part) => part.existingWord).map((part) => part.character);
  if (existing.length === 0) return null;
  const verb = existing.length === 1 ? 'is' : 'are';
  return `${existing.join(' ')} ${verb} already in your words.`;
}

/** Asked once after a bulk add (CSV import, starter set). */
export function bulkCharacterPartsQuestion(newCharacterCount: number): string {
  const characters =
    newCharacterCount === 1
      ? '1 individual character'
      : `${newCharacterCount} individual characters`;
  return `Also add ${characters} from the new nouns to General Vocabulary, to study on their own?`;
}
