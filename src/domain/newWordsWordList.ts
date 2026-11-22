import { WordList, WordListKind } from './wordList';

/**
 * The newest High practice words never marked Learned. Its words are worked out each time it is
 * loaded, so it has no entries of its own and words can't be added to or removed from it by hand.
 */
export class NewWordsWordList extends WordList {
  readonly kind = WordListKind.NewWords;
}
