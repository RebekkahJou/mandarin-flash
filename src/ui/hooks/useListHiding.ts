import type { WordList } from '../../domain/wordList';
import { canHideList, hideStudyList, retentionQuestion } from '../../services/studyListHiding';
import { useAppServices } from '../AppServicesContext';
import { confirm } from '../confirm';

/** What the Components list's cards are called in the Retention question. */
const COMPONENT_CARDS_NAME = 'components';
const HOW_TO_SHOW_AGAIN = 'To show the list again, tap + on the Word lists tab and choose it.';

/**
 * Hiding a study list (Components) from its screen, keeping its cards and their progress. The "+"
 * dialog shows it again.
 */
export function useListHiding(list: WordList | null) {
  const { wordRepository, wordListRepository } = useAppServices();

  /** Resolves true once the list is hidden. */
  const hideList = async (): Promise<boolean> => {
    if (!list || !canHideList(list)) return false;
    const { title, message, moveLabel, keepLabel } = retentionQuestion(
      COMPONENT_CARDS_NAME,
      HOW_TO_SHOW_AGAIN,
    );
    const movesToRetention = await confirm(title, message, moveLabel, keepLabel);
    await hideStudyList({ wordRepository, wordListRepository }, list.id, movesToRetention);
    return true;
  };

  return { canHide: list !== null && canHideList(list), hideList };
}
