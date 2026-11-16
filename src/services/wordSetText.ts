import type { WordSetAddition, WordSetChoice } from './wordSets';
import { formatWordCount } from './wordCount';

/** "Cold/Flu (19 words)", with "Added" for a set the profile already added. */
export function wordSetChoiceLabel(choice: WordSetChoice): string {
  const label = `${choice.title} (${formatWordCount(choice.entryCount)})`;
  return choice.isAdded ? `${label} · Added` : label;
}

export interface WordSetOption {
  value: string;
  label: string;
  isDisabled: boolean;
}

/** Sets still to add first, in pack order; sets already added greyed out at the bottom. */
export function wordSetOptions(choices: readonly WordSetChoice[]): WordSetOption[] {
  const toOption = (choice: WordSetChoice) => ({
    value: choice.setId,
    label: wordSetChoiceLabel(choice),
    isDisabled: choice.isAdded,
  });
  const notAdded = choices.filter((choice) => !choice.isAdded).map(toOption);
  const added = choices.filter((choice) => choice.isAdded).map(toOption);
  return [...notAdded, ...added];
}

/** The modal's button closes it when nothing is chosen. */
export function addWordSetsButtonLabel(selectedCount: number): string {
  if (selectedCount === 0) return 'Close';
  return selectedCount === 1 ? 'Add 1 set' : `Add ${selectedCount} sets`;
}

export function describeWordSetAddition(addition: WordSetAddition): string {
  const { addedWords, alreadyHadCount, topicListName } = addition;
  const added = `Added ${formatWordCount(addedWords.length)} to ${topicListName}, General Vocabulary and their word-type lists.`;
  if (alreadyHadCount === 0) return added;
  const verb = alreadyHadCount === 1 ? 'was' : 'were';
  return `${added} ${formatWordCount(alreadyHadCount)} you already had ${verb} added to ${topicListName}.`;
}
