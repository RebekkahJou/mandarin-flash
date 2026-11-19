import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type { WordList } from '../../domain/wordList';
import type { WordSetTopic } from '../../domain/wordSets';
import { WORD_SET_TOPIC_TITLES, extraListChoicesForWordSets } from '../../domain/wordSets';
import type { WordSetServices, WordSetTopicChoices } from '../../services/wordSets';
import { addWordSets, loadWordSetTopics } from '../../services/wordSets';
import {
  addWordSetsButtonLabel,
  describeWordSetAddition,
  wordSetOptions,
  wordSetTopicLabel,
} from '../../services/wordSetText';
import { useAppServices } from '../AppServicesContext';
import { showMessage } from '../confirm';
import { useCharacterSplit } from './useCharacterSplit';

const TOPICS_TITLE = 'Topic word sets';
const TOPICS_HINT = 'Choose a topic to see its word sets.';
const SETS_HINT = 'Choose the sets you need. You can add more later.';

function toggled<Value>(values: ReadonlySet<Value>, value: Value): Set<Value> {
  const next = new Set(values);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function useWordSetServices(): WordSetServices {
  const appServices = useAppServices();
  const { profileId, languageBundle, packId, dictionaryLookup } = appServices;
  const { wordRepository, wordListRepository, wordSetRepository } = appServices;
  return useMemo<WordSetServices>(
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
}

/**
 * Topic word sets (health, parenting…): which the pack offers, and adding chosen ones. The modal
 * lists the topics first; choosing one shows its sets.
 */
export function useWordSets() {
  const services = useWordSetServices();
  const [topics, setTopics] = useState<WordSetTopicChoices[]>([]);
  const [chosenTopic, setChosenTopic] = useState<WordSetTopic | null>(null);
  const [extraLists, setExtraLists] = useState<WordList[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [selectedListIds, setSelectedListIds] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const characterSplit = useCharacterSplit();

  const refresh = useCallback(async () => {
    setTopics(await loadWordSetTopics(services));
  }, [services]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const chooseTopic = (topic: WordSetTopic | null) => {
    setSelectedSetIds(new Set());
    setSelectedListIds(new Set());
    setChosenTopic(topic);
  };

  const open = async () => {
    const summaries = await services.wordListRepository.listSummaries(services.profileId);
    setExtraLists(extraListChoicesForWordSets(summaries.map(({ list }) => list)));
    chooseTopic(null);
    await refresh();
    setIsVisible(true);
  };

  const addSelected = async (topic: WordSetTopic) => {
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

  const chosen = topics.find(({ topic }) => topic === chosenTopic);
  return {
    isOffered: topics.length > 0,
    isAdding,
    open: () => void open(),
    modal: {
      isVisible,
      isChoosingTopic: !chosen,
      title: chosen ? `${WORD_SET_TOPIC_TITLES[chosen.topic]} word sets` : TOPICS_TITLE,
      hint: chosen ? SETS_HINT : TOPICS_HINT,
      topicOptions: topics.map((topicChoices) => ({
        value: topicChoices.topic,
        label: wordSetTopicLabel(topicChoices),
      })),
      onChooseTopic: chooseTopic,
      onBack: () => chooseTopic(null),
      setOptions: wordSetOptions(chosen?.choices ?? []),
      selectedSetIds,
      onToggleSet: (setId: string) => setSelectedSetIds(toggled(selectedSetIds, setId)),
      extraLists,
      selectedExtraListIds: selectedListIds,
      onToggleExtraList: (listId: number) => setSelectedListIds(toggled(selectedListIds, listId)),
      confirmLabel: addWordSetsButtonLabel(selectedSetIds.size),
      onConfirm: () => {
        if (chosen) void addSelected(chosen.topic);
        else setIsVisible(false);
      },
      onDismiss: () => setIsVisible(false),
    },
  };
}
