import type { StarterSetAddition, StarterVocabularyStatus } from './starterVocabulary';
import { formatWordCount } from './wordCount';

/** What the Lists tab shows about starter vocabulary. */
export interface StarterVocabularyCardText {
  title: string;
  /** Progress through the latest set, once one is added. */
  progress: string | null;
  /** Label of the button that adds the next set, when it is unlocked. */
  addLabel: string | null;
  /** Why the next set can't be added yet, or that every set is added. */
  note: string | null;
}

const TITLE = 'Starter vocabulary';

/** Null when the language's pack has no starter vocabulary, so the card isn't shown. */
export function starterVocabularyCardText(
  status: StarterVocabularyStatus,
): StarterVocabularyCardText | null {
  const { addedSets, next, setCount, nextSetSize } = status;
  if (setCount === 0) return null;
  const latest = addedSets.at(-1);
  const progress = latest
    ? `Set ${latest.setNumber} of ${setCount}: ${latest.learnedCount} of ${latest.setSize} learned`
    : null;
  if (!next) return { title: TITLE, progress, addLabel: null, note: 'Every starter set is added.' };
  if (next.isUnlocked) {
    const addLabel = latest
      ? `Add next ${nextSetSize} starter words`
      : `Add ${nextSetSize} common words to start`;
    return { title: TITLE, progress, addLabel, note: null };
  }
  const remaining = next.learnedNeeded - next.latest.learnedCount;
  const note = `Learn ${remaining} more from set ${next.latest.setNumber} to unlock set ${next.setNumber}.`;
  return { title: TITLE, progress, addLabel: null, note };
}

export function describeStarterSetAddition(addition: StarterSetAddition): string {
  const added = `Added ${formatWordCount(addition.addedWords.length)} to General Vocabulary and their word-type lists.`;
  if (addition.alreadyHadCount === 0) return added;
  const verb = addition.alreadyHadCount === 1 ? 'counts' : 'count';
  const alreadyHad = `${formatWordCount(addition.alreadyHadCount)} you already had ${verb} toward the set.`;
  return `${added} ${alreadyHad}`;
}
