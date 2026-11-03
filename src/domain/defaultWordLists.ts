import { PartOfSpeech } from './partOfSpeech';

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
