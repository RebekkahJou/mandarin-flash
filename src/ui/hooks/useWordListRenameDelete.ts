import { useState } from 'react';

import { canRenameOrDeleteList } from '../../domain/defaultWordLists';
import type { WordList } from '../../domain/wordList';
import { wordListNameProblem } from '../../domain/wordListName';
import { formatWordCount } from '../../services/wordCount';
import { useAppServices } from '../AppServicesContext';
import { confirm, showMessage } from '../confirm';

export enum ListDeletionResult {
  Deleted = 'deleted',
  NotDeleted = 'not_deleted',
}

/** Renaming and deleting one word list. General Vocabulary can do neither. */
export function useWordListRenameDelete(list: WordList | null, onRenamed: () => Promise<void>) {
  const { profileId, wordListRepository } = useAppServices();
  const [isRenameVisible, setIsRenameVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const openRename = () => {
    setNameDraft(list?.name ?? '');
    setIsRenameVisible(true);
  };

  /** The list's own name doesn't count as taken, so only its capitals can be changed. */
  const saveRename = async () => {
    if (!list) return;
    const summaries = await wordListRepository.listSummaries(profileId);
    const otherNames = summaries
      .filter((summary) => summary.list.id !== list.id)
      .map((summary) => summary.list.name);
    const problem = wordListNameProblem(nameDraft, otherNames);
    if (problem) {
      showMessage('Choose another name', problem);
      return;
    }
    await wordListRepository.renameList(list.id, nameDraft.trim());
    setIsRenameVisible(false);
    await onRenamed();
  };

  const deleteList = async (): Promise<ListDeletionResult> => {
    if (!list) return ListDeletionResult.NotDeleted;
    const message =
      `Delete ${list.name} and its ${formatWordCount(list.length)}? ` +
      'The words stay in All words and in any other lists they are in.';
    if (!(await confirm('Delete list?', message, 'Delete'))) return ListDeletionResult.NotDeleted;
    await wordListRepository.deleteList(list.id);
    return ListDeletionResult.Deleted;
  };

  return {
    canRenameOrDelete: list !== null && canRenameOrDeleteList(list),
    isRenameVisible,
    openRename,
    closeRename: () => setIsRenameVisible(false),
    nameDraft,
    setNameDraft,
    saveRename,
    deleteList,
  };
}
