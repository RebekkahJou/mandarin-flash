import { WordList, WordListKind } from './wordList';

/** General Vocabulary, Focus Vocabulary, Phrases and user-created lists. */
export class GeneralWordList extends WordList {
  readonly kind = WordListKind.General;
}
