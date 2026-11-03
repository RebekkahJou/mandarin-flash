import { PartOfSpeech } from './partOfSpeech';
import type { WordList } from './wordList';

export interface DefaultWordListDefinition {
  name: string;
  partOfSpeech?: PartOfSpeech;
}

export const GENERAL_VOCABULARY_LIST_NAME = 'General Vocabulary';

/** Created for every new profile, in display order. */
export const DEFAULT_WORD_LISTS: readonly DefaultWordListDefinition[] = [
  { name: GENERAL_VOCABULARY_LIST_NAME },
  { name: 'Focus Vocabulary' },
  { name: 'Nouns', partOfSpeech: PartOfSpeech.Noun },
  { name: 'Verbs', partOfSpeech: PartOfSpeech.Verb },
  { name: 'Adjectives', partOfSpeech: PartOfSpeech.Adjective },
  { name: 'Phrases' },
];

/** New words go to General Vocabulary unless the user picks other lists. */
export function defaultListIdsForNewWords(lists: readonly WordList[]): Set<number> {
  const generalList = lists.find((list) => list.name === GENERAL_VOCABULARY_LIST_NAME);
  return new Set(generalList ? [generalList.id] : []);
}
