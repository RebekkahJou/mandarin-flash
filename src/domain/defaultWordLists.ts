import { PartOfSpeech } from './partOfSpeech';
import type { WordList } from './wordList';
import { WordListKind } from './wordList';

export interface DefaultWordListDefinition {
  name: string;
  partOfSpeech?: PartOfSpeech;
  /** Only for lists of a special kind, such as Components; otherwise derived from partOfSpeech. */
  kind?: WordListKind.Components | WordListKind.ScriptStudy;
}

export const GENERAL_VOCABULARY_LIST_NAME = 'General Vocabulary';
export const PHRASES_LIST_NAME = 'Phrases';
export const TIME_WORDS_LIST_NAME = 'Time words';
export const COMPONENTS_LIST_NAME = 'Components';

/** Created for every new profile, in display order, before the language's own extra lists. */
export const DEFAULT_WORD_LISTS: readonly DefaultWordListDefinition[] = [
  { name: GENERAL_VOCABULARY_LIST_NAME },
  { name: 'Focus Vocabulary' },
  { name: 'Nouns', partOfSpeech: PartOfSpeech.Noun },
  { name: 'Verbs', partOfSpeech: PartOfSpeech.Verb },
  { name: 'Adjectives', partOfSpeech: PartOfSpeech.Adjective },
  { name: 'Adverbs', partOfSpeech: PartOfSpeech.Adverb },
  { name: PHRASES_LIST_NAME },
];

/** Offered when the user creates a list, in every language. */
export const SUGGESTED_WORD_LISTS: readonly DefaultWordListDefinition[] = [
  { name: 'Pronouns', partOfSpeech: PartOfSpeech.Pronoun },
  { name: 'Prepositions', partOfSpeech: PartOfSpeech.Preposition },
  { name: 'Conjunctions', partOfSpeech: PartOfSpeech.Conjunction },
  { name: 'Numbers', partOfSpeech: PartOfSpeech.Numeral },
  { name: 'Question words', partOfSpeech: PartOfSpeech.QuestionWord },
  { name: 'Particles', partOfSpeech: PartOfSpeech.Particle },
  { name: TIME_WORDS_LIST_NAME },
];

/** Every list a new profile of this language starts with, in display order. */
export function defaultWordListsFor(
  languageExtraLists: readonly DefaultWordListDefinition[],
): DefaultWordListDefinition[] {
  return [...DEFAULT_WORD_LISTS, ...languageExtraLists];
}

/**
 * Lists worth offering in the "new list" dialog: the language's default lists the profile no
 * longer has (or never had, e.g. Adverbs for profiles made before it was a default), then the
 * suggested lists. Names already in use are left out, ignoring case.
 */
export function suggestedWordListsFor(
  languageExtraLists: readonly DefaultWordListDefinition[],
  existingListNames: readonly string[],
): DefaultWordListDefinition[] {
  const usedNames = new Set(existingListNames.map((name) => name.toLowerCase()));
  const candidates = [...defaultWordListsFor(languageExtraLists), ...SUGGESTED_WORD_LISTS];
  return candidates.filter((list) => !usedNames.has(list.name.toLowerCase()));
}

/** The kind of list a definition creates. */
export function listKindFor(definition: DefaultWordListDefinition): WordListKind {
  if (definition.kind) return definition.kind;
  return definition.partOfSpeech ? WordListKind.PartOfSpeech : WordListKind.General;
}

/** New words go to General Vocabulary unless the user picks other lists. */
export function defaultListIdsForNewWords(lists: readonly WordList[]): Set<number> {
  const generalList = lists.find((list) => list.name === GENERAL_VOCABULARY_LIST_NAME);
  return new Set(generalList ? [generalList.id] : []);
}

/** General Vocabulary is found by name and receives new words, so it can't be renamed or deleted. */
export function canRenameOrDeleteList(list: WordList): boolean {
  return list.name !== GENERAL_VOCABULARY_LIST_NAME;
}
