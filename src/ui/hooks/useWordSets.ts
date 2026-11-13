import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type { WordList } from '../../domain/wordList';
import type { WordSetTopic } from '../../domain/wordSets';
import { extraListChoicesForWordSets } from '../../domain/wordSets';
import type { WordSetChoice, WordSetServices } from '../../services/wordSets';
import { addWordSets, loadWordSetChoices } from '../../services/wordSets';
import {
  addWordSetsButtonLabel,
  describeWordSetAddition,
  wordSetOptions,
} from '../../services/wordSetText';
import { useAppServices } from '../AppServicesContext';
import { showMessage } from '../confirm';
import { useCharacterSplit } from './useCharacterSplit';

function toggled<Value>(values: ReadonlySet<Value>, value: Value): Set<Value> {
  const next = new Set(values);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/** A topic's word sets (e.g. health vocabulary): which the pack offers, and adding chosen ones. */
export function useWordSets(topic: WordSetTopic) {
  const appServices = useAppServices();
  const { profileId, languageBundle, packId, dictionaryLookup } = appServices;
  const { wordRepository, wordListRepository, wordSetRepository } = appServices;
  const [choices, setChoices] = useState<WordSetChoice[]>([]);
  const [extraLists, setExtraLists] = useState<WordList[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [selectedListIds, setSelectedListIds] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const characterSplit = useCharacterSplit();
  const services = useMemo<WordSetServices>(
    () => ({
      profileId,
      languageId: languageBundle.definition.id,
      packId,
      languageExtraLists: languageBundle.definition.extraDefaultWordLists,
      dictionaryLookup,
      wordRepository,
      wordListRepository,
      wordSetRepository,
    }),
    [
      profileId,
      languageBundle,
      packId,
      dictionaryLookup,
      wordRepository,
      wordListRepository,
      wordSetRepository,
    ],
  );

  const refresh = useCallback(async () => {
    setChoices(await loadWordSetChoices(services, topic));
  }, [services, topic]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const open = async () => {
    const summaries = await wordListRepository.listSummaries(profileId);
    setExtraLists(extraListChoicesForWordSets(summaries.map(({ list }) => list)));
    setSelectedSetIds(new Set());
    setSelectedListIds(new Set());
    await refresh();
    setIsVisible(true);
  };

  const addSelected = async () => {
    if (isAdding) return;
    setIsVisible(false);
    if (selectedSetIds.size === 0) return;
    setIsAdding(true);
    try {
      const addition = await addWordSets(
        services,
        topic,
        [...selectedSetIds],
        [...selectedListIds],
      );
      await characterSplit.offerForBulkAdd(addition.addedNouns);
      showMessage('Word sets added', describeWordSetAddition(addition));
    } catch (error) {
      console.error(error);
      showMessage('Could not add the word sets', 'Something went wrong. Please try again.');
    } finally {
      setIsAdding(false);
      await refresh();
    }
  };

  return {
    isOffered: choices.length > 0,
    isAdding,
    open: () => void open(),
    modal: {
      isVisible,
      setOptions: wordSetOptions(choices),
      selectedSetIds,
      onToggleSet: (setId: string) => setSelectedSetIds(toggled(selectedSetIds, setId)),
      extraLists,
      selectedExtraListIds: selectedListIds,
      onToggleExtraList: (listId: number) => setSelectedListIds(toggled(selectedListIds, listId)),
      confirmLabel: addWordSetsButtonLabel(selectedSetIds.size),
      onConfirm: () => void addSelected(),
      onDismiss: () => setIsVisible(false),
    },
  };
}
