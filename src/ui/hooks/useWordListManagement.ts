import { useState } from 'react';

import type { WordList } from '../../domain/wordList';
import { wordListNameProblem } from '../../domain/wordListName';
import { useAppServices } from '../AppServicesContext';
import { showMessage } from '../confirm';

/** Creating new word lists and changing the order lists are shown in. */
export function useWordListManagement(lists: readonly WordList[], onChanged: () => Promise<void>) {
  const { profileId, wordListRepository } = useAppServices();
  const [isCreatorVisible, setIsCreatorVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const openCreator = () => {
    setNewListName('');
    setIsCreatorVisible(true);
  };

  const createList = async () => {
    const problem = wordListNameProblem(
      newListName,
      lists.map((list) => list.name),
    );
    if (problem) {
      showMessage('Choose another name', problem);
      return;
    }
    await wordListRepository.createGeneralList(profileId, newListName.trim());
    setIsCreatorVisible(false);
    await onChanged();
  };

  const saveListOrder = async (orderedListIds: number[]) => {
    await wordListRepository.setListOrder(orderedListIds);
    await onChanged();
  };

  return {
    isCreatorVisible,
    openCreator,
    closeCreator: () => setIsCreatorVisible(false),
    newListName,
    setNewListName,
    createList,
    isReordering,
    toggleReordering: () => setIsReordering((wasReordering) => !wasReordering),
    saveListOrder,
    isDragging,
    setIsDragging,
  };
}
