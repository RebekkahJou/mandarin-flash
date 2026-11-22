import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type { WordList } from '../../domain/wordList';
import type { WordSetTopic } from '../../domain/wordSets';
import {
  WORD_SET_TOPIC_TITLES,
  extraListChoicesForWordSets,
  wordSetEntryKey,
} from '../../domain/wordSets';
import type { WordSetEntry } from '../../services/dictionaryLookup';
import type { WordSetServices, WordSetTopicChoices } from '../../services/wordSets';
import { addWordSets, loadWordSetPreview, loadWordSetTopics } from '../../services/wordSets';
import {
  addWordSetsButtonLabel,
  describeWordSetAddition,
  wordSetOptions,
  wordSetPreviewButtonLabel,
  wordSetTopicLabel,
} from '../../services/wordSetText';
import { useAppServices } from '../AppServicesContext';
import { showMessage } from '../confirm';
import { useCharacterSplit } from './useCharacterSplit';

const TOPICS_TITLE = 'Topic word sets';
const TOPICS_HINT =
  'Choose a topic to see its word sets. Each topic’s words go into a list of their own, General Vocabulary and their word-type lists.';
const PREVIEW_HINT = 'Uncheck any words you don’t need. They won’t be added with this set.';
const SETS_HINT =
  'Choose the sets you need. We suggest one or two at a time, since smaller batches are easier to learn. You can add more later.';

function toggled<Value>(values: ReadonlySet<Value>, value: Value): Set<Value> {
  const next = new Set(values);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

interface WordSetPreview {
  setId: string;
  title: string;
  entries: WordSetEntry[];
}

function sizesOf(skippedBySet: ReadonlyMap<string, ReadonlySet<string>>): Map<string, number> {
  return new Map([...skippedBySet].map(([setId, keys]) => [setId, keys.size]));
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
 * lists the topics first; choosing one shows its sets, and each set can be previewed to uncheck
 * words the user doesn't need.
 */
export function useWordSets(onAdded: () => void) {
  const services = useWordSetServices();
  const [topics, setTopics] = useState<WordSetTopicChoices[]>([]);
  const [chosenTopic, setChosenTopic] = useState<WordSetTopic | null>(null);
  const [extraLists, setExtraLists] = useState<WordList[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [selectedListIds, setSelectedListIds] = useState<Set<number>>(new Set());
  const [skippedBySet, setSkippedBySet] = useState<Map<string, Set<string>>>(new Map());
  const [preview, setPreview] = useState<WordSetPreview | null>(null);
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
    setSkippedBySet(new Map());
    setPreview(null);
    setChosenTopic(topic);
  };

  const openPreview = async (setId: string, title: string) => {
    setPreview({ setId, title, entries: await loadWordSetPreview(services, setId) });
  };

  const skippedInPreview = preview ? (skippedBySet.get(preview.setId) ?? new Set<string>()) : null;

  const togglePreviewEntry = (entryKey: string) => {
    if (!preview || !skippedInPreview) return;
    setSkippedBySet(new Map(skippedBySet).set(preview.setId, toggled(skippedInPreview, entryKey)));
  };

  const checkedPreviewCount = preview ? preview.entries.length - (skippedInPreview?.size ?? 0) : 0;

  /** Choosing words selects the set; unchecking every word deselects it. */
  const choosePreview = () => {
    if (!preview) return;
    const next = new Set(selectedSetIds);
    if (checkedPreviewCount === 0) next.delete(preview.setId);
    else next.add(preview.setId);
    setSelectedSetIds(next);
    setPreview(null);
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
        skippedBySet,
      );
      await characterSplit.offerForBulkAdd(addition.addedNouns);
      showMessage('Word sets added', describeWordSetAddition(addition));
    } catch (error) {
      console.error(error);
      showMessage('Could not add the word sets', 'Something went wrong. Please try again.');
    } finally {
      setIsAdding(false);
      await refresh();
      onAdded();
    }
  };

  const chosen = topics.find(({ topic }) => topic === chosenTopic);
  const setTitleById = new Map(
    (chosen?.choices ?? []).map((choice) => [choice.setId, choice.title]),
  );
  const title = chosen ? `${WORD_SET_TOPIC_TITLES[chosen.topic]} word sets` : TOPICS_TITLE;
  const hint = chosen ? SETS_HINT : TOPICS_HINT;
  const confirmLabel = addWordSetsButtonLabel(selectedSetIds.size);
  const onConfirm = () => {
    if (preview) choosePreview();
    else if (chosen) void addSelected(chosen.topic);
    else setIsVisible(false);
  };
  return {
    isOffered: topics.length > 0,
    isAdding,
    open: () => void open(),
    modal: {
      isVisible,
      isChoosingTopic: !chosen,
      title: preview?.title ?? title,
      hint: preview ? PREVIEW_HINT : hint,
      topicOptions: topics.map((topicChoices) => ({
        value: topicChoices.topic,
        label: wordSetTopicLabel(topicChoices),
      })),
      onChooseTopic: chooseTopic,
      onBack: () => chooseTopic(null),
      setOptions: wordSetOptions(chosen?.choices ?? [], sizesOf(skippedBySet)),
      selectedSetIds,
      onToggleSet: (setId: string) => setSelectedSetIds(toggled(selectedSetIds, setId)),
      onPreviewSet: (setId: string) => void openPreview(setId, setTitleById.get(setId) ?? ''),
      preview: preview
        ? {
            entries: preview.entries.map((entry) => ({
              key: wordSetEntryKey(entry),
              headword: entry.headword,
              reading: entry.reading,
              meaning: entry.meanings[0] ?? '',
            })),
            skippedKeys: skippedInPreview ?? new Set<string>(),
            onToggleEntry: togglePreviewEntry,
            onBack: () => setPreview(null),
          }
        : null,
      extraLists,
      selectedExtraListIds: selectedListIds,
      onToggleExtraList: (listId: number) => setSelectedListIds(toggled(selectedListIds, listId)),
      confirmLabel: preview ? wordSetPreviewButtonLabel(checkedPreviewCount) : confirmLabel,
      onConfirm,
      onDismiss: () => setIsVisible(false),
    },
  };
}
