import { WordList, WordListKind } from './wordList';

/**
 * Cards for learning a writing or phonetic system itself, such as the zhuyin symbols. They aren't
 * words, so no word type is checked.
 */
export class ScriptStudyWordList extends WordList {
  readonly kind = WordListKind.ScriptStudy;
}
