import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type {
  StarterVocabularyServices,
  StarterVocabularyStatus,
} from '../../services/starterVocabulary';
import { addStarterSet, loadStarterVocabularyStatus } from '../../services/starterVocabulary';
import {
  describeStarterSetAddition,
  starterVocabularyCardText,
} from '../../services/starterVocabularyText';
import { useAppServices } from '../AppServicesContext';
import { showMessage } from '../confirm';
import { useCharacterSplit } from './useCharacterSplit';

/** Starter set progress for the Lists tab, refreshed on focus, and adding the next set. */
export function useStarterVocabulary(onAdded: () => void) {
  const { profileId, languageBundle, dictionaryLookup, wordRepository, wordListRepository } =
    useAppServices();
  const [status, setStatus] = useState<StarterVocabularyStatus | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const characterSplit = useCharacterSplit();
  const services = useMemo<StarterVocabularyServices>(
    () => ({
      profileId,
      languageExtraLists: languageBundle.definition.extraDefaultWordLists,
      dictionaryLookup,
      wordRepository,
      wordListRepository,
    }),
    [profileId, languageBundle, dictionaryLookup, wordRepository, wordListRepository],
  );

  const refresh = useCallback(async () => {
    setStatus(await loadStarterVocabularyStatus(services));
  }, [services]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const addNextSet = async () => {
    if (!status?.next?.isUnlocked || isAdding) return;
    setIsAdding(true);
    try {
      const addition = await addStarterSet(services, status.next.setNumber);
      await characterSplit.offerForBulkAdd(addition.addedNouns);
      showMessage('Starter words added', describeStarterSetAddition(addition));
      onAdded();
    } catch (error) {
      console.error(error);
      showMessage('Could not add starter words', 'Something went wrong. Please try again.');
    } finally {
      setIsAdding(false);
      await refresh();
    }
  };

  const cardText = status ? starterVocabularyCardText(status) : null;
  return { cardText, isAdding, addNextSet };
}
