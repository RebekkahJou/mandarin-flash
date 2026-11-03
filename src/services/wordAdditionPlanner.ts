import type { PartOfSpeech } from '../domain/partOfSpeech';
import type { DefinitionCandidate } from '../domain/word';
import type { WordList } from '../domain/wordList';

export enum AdditionWarningKind {
  AlreadyInList = 'already_in_list',
  PartOfSpeechMismatch = 'part_of_speech_mismatch',
}

export interface AdditionWarning {
  kind: AdditionWarningKind;
  wordListId: number;
  message: string;
}

export interface PlannedListAddition {
  wordListId: number;
  definitionsOverride?: string[];
  /** Each warning needs the user's confirmation before this list gets the word. */
  warnings: AdditionWarning[];
}

export interface WordAdditionRequest {
  traditional: string;
  selectedLists: readonly WordList[];
  /** Meanings shown in the form (the word's own definitions). */
  formMeanings: readonly string[];
  /** True once the user changes the suggested meanings; their choice then applies everywhere. */
  hasUserEditedMeanings: boolean;
  definitionCandidates: readonly DefinitionCandidate[];
  wordPartsOfSpeech: readonly PartOfSpeech[];
  listIdsAlreadyContainingWord: ReadonlySet<number>;
}

function haveSameMeanings(first: readonly string[], second: readonly string[]): boolean {
  return (
    first.length === second.length && first.every((meaning, index) => meaning === second[index])
  );
}

/**
 * Decides, for each selected list, which meanings it should show and what the user must confirm.
 * Part-of-speech lists get their own suggested meanings (e.g. only verb meanings in Verbs)
 * unless the user typed their own.
 */
export function planWordAddition(request: WordAdditionRequest): PlannedListAddition[] {
  return request.selectedLists.map((list) => {
    const warnings: AdditionWarning[] = [];
    if (request.listIdsAlreadyContainingWord.has(list.id)) {
      warnings.push({
        kind: AdditionWarningKind.AlreadyInList,
        wordListId: list.id,
        message: `${request.traditional} is already in ${list.name}. Add it again?`,
      });
    }
    const partOfSpeechWarning = list.validateWord(request.wordPartsOfSpeech);
    if (partOfSpeechWarning) {
      warnings.push({
        kind: AdditionWarningKind.PartOfSpeechMismatch,
        wordListId: list.id,
        message: partOfSpeechWarning.message,
      });
    }
    const listMeanings = request.hasUserEditedMeanings
      ? request.formMeanings
      : list.selectDefaultMeanings(request.definitionCandidates);
    const needsOverride =
      listMeanings.length > 0 && !haveSameMeanings(listMeanings, request.formMeanings);
    return {
      wordListId: list.id,
      definitionsOverride: needsOverride ? [...listMeanings] : undefined,
      warnings,
    };
  });
}
