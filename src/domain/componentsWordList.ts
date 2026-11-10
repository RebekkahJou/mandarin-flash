import { WordList, WordListKind } from './wordList';

/**
 * Character components (radicals) such as 氵 and 亻, filled from the language pack. Components
 * aren't words, so no word type is checked.
 */
export class ComponentsWordList extends WordList {
  readonly kind = WordListKind.Components;
}
