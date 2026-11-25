import type { TextWordSearch } from './textWordFinder';
import { MAX_SEARCHED_TEXT_LENGTH } from './textWordFinder';
import { formatWordCount } from './wordCount';

export const ALREADY_ADDED_NOTE = 'Already added';
export const FOUND_WORDS_ADDED_MESSAGE =
  'The words are in your lists. Paste more text to find more.';

export function foundWordsSummary(search: TextWordSearch): string {
  if (search.words.length === 0) return 'No dictionary words found in this text.';
  const found = `Found ${formatWordCount(search.words.length)}.`;
  const alreadyAddedCount = search.words.filter((word) => word.isInProfile).length;
  if (alreadyAddedCount === 0) return found;
  const verb = alreadyAddedCount === 1 ? 'is' : 'are';
  return `${found} ${formatWordCount(alreadyAddedCount)} you already have ${verb} unchecked.`;
}

/** Notes under the summary: characters the dictionary lacks and a shortened text. */
export function foundWordsNotes(search: TextWordSearch): string[] {
  const notes: string[] = [];
  if (search.unknownCharacters.length > 0) {
    notes.push(`Not in the dictionary: ${search.unknownCharacters.join(', ')}`);
  }
  if (search.wasShortened) {
    notes.push(`Only the first ${MAX_SEARCHED_TEXT_LENGTH} characters were searched.`);
  }
  return notes;
}

export function addFoundWordsButtonLabel(checkedCount: number): string {
  if (checkedCount === 0) return 'Add words';
  return `Add ${formatWordCount(checkedCount)}`;
}
