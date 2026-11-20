/** Text for deleting words from a profile, one at a time or several from All words. */
import { formatWordCount } from './wordCount';

export interface DeletionPrompt {
  title: string;
  message: string;
  confirmLabel: string;
}

const DELETE_LABEL = 'Delete';
const CONSEQUENCES = 'removed from every list and its practice history is deleted';

export function deleteWordPrompt(headword: string): DeletionPrompt {
  return {
    title: `Delete ${headword}?`,
    message: `It's ${CONSEQUENCES}.`,
    confirmLabel: DELETE_LABEL,
  };
}

export function deleteWordsPrompt(count: number): DeletionPrompt {
  if (count === 1) {
    return {
      title: 'Delete 1 word?',
      message: `It's ${CONSEQUENCES}.`,
      confirmLabel: DELETE_LABEL,
    };
  }
  return {
    title: `Delete ${formatWordCount(count)}?`,
    message: `Each one is ${CONSEQUENCES}.`,
    confirmLabel: DELETE_LABEL,
  };
}

export function deleteSelectedButtonLabel(selectedCount: number): string {
  return `Delete ${formatWordCount(selectedCount)}`;
}
