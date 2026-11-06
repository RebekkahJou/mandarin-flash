import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { FrequencyTier } from '../../domain/frequencyTier';
import type { Word } from '../../domain/word';
import type { WordList } from '../../domain/wordList';
import { WordListKind } from '../../domain/wordList';
import { findReading, partsOfSpeechOf } from '../../services/dictionaryLookup';
import { planWordAddition } from '../../services/wordAdditionPlanner';
import { useAppServices } from '../AppServicesContext';
import { confirm, confirmPlannedAdditions } from '../confirm';

/** Loads one word and changes its frequency tier and the lists it belongs to. */
export function useWordEditor(wordId: number) {
  const { profileId, languageBundle, wordRepository, wordListRepository, dictionaryLookup } =
    useAppServices();
  const [word, setWord] = useState<Word | null>(null);
  const [lists, setLists] = useState<WordList[]>([]);
  const [memberListIds, setMemberListIds] = useState<ReadonlySet<number>>(new Set());

  const reload = useCallback(async () => {
    const summaries = await wordListRepository.listSummaries(profileId);
    setLists(summaries.map((summary) => summary.list));
    setMemberListIds(new Set(await wordListRepository.listIdsContainingWord(wordId)));
    setWord(await wordRepository.getWord(wordId));
  }, [profileId, wordId, wordRepository, wordListRepository]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const setFrequencyTier = async (tier: FrequencyTier) => {
    await wordRepository.setFrequencyTier(wordId, tier);
    await reload();
  };

  /** Warns about part-of-speech mismatches, just like adding a new word. */
  const addToList = async (currentWord: Word, list: WordList) => {
    const readings = await dictionaryLookup.lookUp(currentWord.headword);
    const reading = findReading(readings, currentWord.reading);
    const plan = planWordAddition({
      headword: currentWord.headword,
      selectedLists: [list],
      formMeanings: currentWord.definitions,
      // Part-of-speech lists suggest their own meanings (e.g. only verb meanings in Verbs);
      // every other list keeps the word's meanings.
      hasUserEditedMeanings: list.kind !== WordListKind.PartOfSpeech,
      definitionCandidates: reading?.definitionCandidates ?? [],
      wordPartsOfSpeech: partsOfSpeechOf(reading ? [reading] : []),
      reliablePartsOfSpeech: languageBundle.definition.reliablePartsOfSpeech,
      listIdsAlreadyContainingWord: new Set(),
    });
    const additions = await confirmPlannedAdditions(plan);
    await wordListRepository.addWordToLists(
      currentWord.id,
      additions.map(({ wordListId, definitionsOverride }) => ({ wordListId, definitionsOverride })),
    );
  };

  const removeFromList = async (currentWord: Word, list: WordList) => {
    const message = `Remove ${currentWord.headword} from ${list.name}? Any meanings you set for it in that list will be lost.`;
    if (!(await confirm('Remove from list?', message, 'Remove'))) return;
    await wordListRepository.removeWordFromList(currentWord.id, list.id);
  };

  const toggleList = async (list: WordList) => {
    if (!word) return;
    if (memberListIds.has(list.id)) await removeFromList(word, list);
    else await addToList(word, list);
    await reload();
  };

  return { word, lists, memberListIds, setFrequencyTier, toggleList };
}
