import { WORD_SET_TOPIC_TITLES } from '../domain/wordSets';
import type { WordSetAddition, WordSetChoice, WordSetTopicChoices } from './wordSets';
import { formatWordCount } from './wordCount';

/** "Health (17 sets)", or "Health (17 sets, 2 added)" once the profile added some. */
export function wordSetTopicLabel({ topic, choices }: WordSetTopicChoices): string {
  const setCount = choices.length === 1 ? '1 set' : `${choices.length} sets`;
  const addedCount = choices.filter((choice) => choice.isAdded).length;
  const counts = addedCount === 0 ? setCount : `${setCount}, ${addedCount} added`;
  return `${WORD_SET_TOPIC_TITLES[topic]} (${counts})`;
}

/**
 * "Cold/Flu (19 words)", "Cold/Flu (17 of 19 words)" once words are unchecked in its preview,
 * with "Added" for a set the profile already added.
 */
export function wordSetChoiceLabel(choice: WordSetChoice, skippedCount = 0): string {
  const allWords = formatWordCount(choice.entryCount);
  const counts =
    skippedCount === 0 ? allWords : `${choice.entryCount - skippedCount} of ${allWords}`;
  const label = `${choice.title} (${counts})`;
  return choice.isAdded ? `${label} · Added` : label;
}

export interface WordSetOption {
  value: string;
  label: string;
  isDisabled: boolean;
}

/** Sets still to add first, in pack order; sets already added greyed out at the bottom. */
export function wordSetOptions(
  choices: readonly WordSetChoice[],
  skippedCounts: ReadonlyMap<string, number> = new Map(),
): WordSetOption[] {
  const toOption = (choice: WordSetChoice) => ({
    value: choice.setId,
    label: wordSetChoiceLabel(choice, skippedCounts.get(choice.setId) ?? 0),
    isDisabled: choice.isAdded,
  });
  const notAdded = choices.filter((choice) => !choice.isAdded).map(toOption);
  const added = choices.filter((choice) => choice.isAdded).map(toOption);
  return [...notAdded, ...added];
}

/** The preview's button goes back to the sets when every word is unchecked. */
export function wordSetPreviewButtonLabel(checkedCount: number): string {
  if (checkedCount === 0) return 'Back to sets';
  return `Choose ${formatWordCount(checkedCount)}`;
}

/** The modal's button closes it when nothing is chosen. */
export function addWordSetsButtonLabel(selectedCount: number): string {
  if (selectedCount === 0) return 'Close';
  return selectedCount === 1 ? 'Add 1 set' : `Add ${selectedCount} sets`;
}

/** Leaves out the new words when there were none, e.g. a set shared with a topic already added. */
export function describeWordSetAddition(addition: WordSetAddition): string {
  const { addedWords, alreadyHadCount, topicListName } = addition;
  const added = `Added ${formatWordCount(addedWords.length)} to ${topicListName}, General Vocabulary and their word-type lists.`;
  if (alreadyHadCount === 0) return added;
  const isOne = alreadyHadCount === 1;
  if (addedWords.length === 0) {
    const pronoun = isOne ? 'It was' : 'They were';
    return `You already had ${isOne ? 'this word' : `all ${alreadyHadCount} words`}. ${pronoun} added to ${topicListName}.`;
  }
  const verb = isOne ? 'was' : 'were';
  return `${added} ${formatWordCount(alreadyHadCount)} you already had ${verb} added to ${topicListName}.`;
}
