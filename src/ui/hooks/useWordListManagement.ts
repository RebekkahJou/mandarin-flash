import { useState } from 'react';

import type { DefaultWordListDefinition } from '../../domain/defaultWordLists';
import { suggestedWordListsFor } from '../../domain/defaultWordLists';
import type { WordList } from '../../domain/wordList';
import { wordListNameProblem } from '../../domain/wordListName';
import { useAppServices } from '../AppServicesContext';
import { showMessage } from '../confirm';

/** Creating new word lists and changing the order lists are shown in. */
export function useWordListManagement(lists: readonly WordList[], onChanged: () => Promise<void>) {
  const { profileId, languageBundle, wordListRepository } = useAppServices();
  const [isCreatorVisible, setIsCreatorVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const openCreator = () => {
    setNewListName('');
    setIsCreatorVisible(true);
  };

  const existingNames = lists.map((list) => list.name);
  const suggestedLists = suggestedWordListsFor(
    languageBundle.definition.extraDefaultWordLists,
    existingNames,
  );

  const addList = async (definition: DefaultWordListDefinition) => {
    await wordListRepository.createList(profileId, definition);
    setIsCreatorVisible(false);
    await onChanged();
  };

  const createList = async () => {
    const problem = wordListNameProblem(newListName, existingNames);
    if (problem) {
      showMessage('Choose another name', problem);
      return;
    }
    await addList({ name: newListName.trim() });
  };

  /** Suggested lists keep their word type, so Pronouns works like Nouns or Verbs. */
  const createSuggestedList = async (suggestionName: string) => {
    const suggestion = suggestedLists.find((list) => list.name === suggestionName);
    if (suggestion) await addList(suggestion);
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
    suggestedListNames: suggestedLists.map((list) => list.name),
    createSuggestedList,
    isReordering,
    toggleReordering: () => setIsReordering((wasReordering) => !wasReordering),
    saveListOrder,
    isDragging,
    setIsDragging,
  };
}
