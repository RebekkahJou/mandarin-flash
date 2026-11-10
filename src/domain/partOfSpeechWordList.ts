import type { DefinitionCandidate } from './word';
import { DEFAULT_MEANING_COUNT } from './word';
import type { PartOfSpeech } from './partOfSpeech';
import type { WordListProps, WordListValidationWarning } from './wordList';
import { WordList, WordListKind, firstMeanings } from './wordList';

/** Nouns, Verbs, Adjectives: meanings and validation follow the list's part of speech. */
export class PartOfSpeechWordList extends WordList {
  readonly kind = WordListKind.PartOfSpeech;
  readonly partOfSpeech: PartOfSpeech;

  constructor(props: WordListProps & { partOfSpeech: PartOfSpeech }) {
    super(props);
    this.partOfSpeech = props.partOfSpeech;
  }

  override selectDefaultMeanings(candidates: readonly DefinitionCandidate[]): string[] {
    const matchingMeanings = candidates
      .filter((candidate) => candidate.partsOfSpeech.includes(this.partOfSpeech))
      .slice(0, DEFAULT_MEANING_COUNT)
      .map((candidate) => candidate.text);
    // Fall back to any meanings so the user never starts from an empty form.
    return matchingMeanings.length > 0 ? matchingMeanings : firstMeanings(candidates);
  }

  override validateWord(
    wordPartsOfSpeech: readonly PartOfSpeech[],
    reliablePartsOfSpeech: readonly PartOfSpeech[],
  ): WordListValidationWarning | null {
    // A word type the dictionary tags loosely (e.g. adverbs from CC-CEDICT) would cause false
    // warnings, and an unknown word (no dictionary data) can't be judged; neither is flagged.
    if (!reliablePartsOfSpeech.includes(this.partOfSpeech)) return null;
    if (wordPartsOfSpeech.length === 0 || wordPartsOfSpeech.includes(this.partOfSpeech)) {
      return null;
    }
    return {
      listName: this.name,
      message: `This word has no ${this.partOfSpeech} meaning. Add it to ${this.name} anyway?`,
    };
  }
}
