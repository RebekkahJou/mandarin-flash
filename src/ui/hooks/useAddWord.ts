import { useCallback, useState } from 'react';

import { GENERAL_VOCABULARY_LIST_NAME } from '../../domain/defaultWordLists';
import type { WordList } from '../../domain/wordList';
import { firstMeanings } from '../../domain/wordList';
import { containsChineseCharacters, toTaiwanTraditional } from '../../services/chineseConverter';
import type { DictionaryEntry } from '../../services/dictionaryLookup';
import { partsOfSpeechOf } from '../../services/dictionaryLookup';
import { toNumberedPinyin } from '../../services/pinyin';
import type { PlannedListAddition } from '../../services/wordAdditionPlanner';
import { planWordAddition } from '../../services/wordAdditionPlanner';
import { useAppServices } from '../AppServicesContext';
import { confirm, showMessage } from '../confirm';

export enum SaveWordResult {
  Saved = 'saved',
  NotSaved = 'not_saved',
}

/** Asks the user about each warning; a list is skipped if any of its warnings is declined. */
async function confirmedAdditions(plan: readonly PlannedListAddition[]) {
  const confirmed: PlannedListAddition[] = [];
  for (const addition of plan) {
    let isAccepted = true;
    for (const warning of addition.warnings) {
      isAccepted = isAccepted && (await confirm('Please confirm', warning.message, 'Add anyway'));
    }
    if (isAccepted) confirmed.push(addition);
  }
  return confirmed;
}

/** State and save logic for the Add Word screen. */
export function useAddWord(lists: readonly WordList[]) {
  const { profileId, dictionaryLookup, wordRepository, wordListRepository } = useAppServices();
  const [traditional, setTraditional] = useState('');
  const [readings, setReadings] = useState<DictionaryEntry[]>([]);
  const [selectedReadingIndex, setSelectedReadingIndex] = useState(0);
  const [manualPinyin, setManualPinyin] = useState('');
  const [meanings, setMeaningsState] = useState<string[]>([]);
  const [hasUserEditedMeanings, setHasUserEditedMeanings] = useState(false);
  const [explicitListIds, setExplicitListIds] = useState<Set<number> | null>(null);

  const generalListId = lists.find((list) => list.name === GENERAL_VOCABULARY_LIST_NAME)?.id;
  // New words go to General Vocabulary unless the user picks lists.
  const selectedListIds =
    explicitListIds ?? new Set(generalListId === undefined ? [] : [generalListId]);
  const selectedReading = readings[selectedReadingIndex] as DictionaryEntry | undefined;

  const lookUpCharacters = useCallback(
    async (input: string) => {
      const converted = toTaiwanTraditional(input);
      setTraditional(converted);
      const foundReadings = containsChineseCharacters(converted)
        ? await dictionaryLookup.lookUp(converted)
        : [];
      setReadings(foundReadings);
      setSelectedReadingIndex(0);
      setMeaningsState(firstMeanings(foundReadings[0]?.definitionCandidates ?? []));
      setHasUserEditedMeanings(false);
    },
    [dictionaryLookup],
  );

  const selectReading = (index: number) => {
    setSelectedReadingIndex(index);
    if (!hasUserEditedMeanings) {
      setMeaningsState(firstMeanings(readings[index]?.definitionCandidates ?? []));
    }
  };

  const setMeanings = (newMeanings: string[]) => {
    setMeaningsState(newMeanings);
    setHasUserEditedMeanings(true);
  };

  const toggleList = (wordListId: number) => {
    const next = new Set(selectedListIds);
    if (next.has(wordListId)) next.delete(wordListId);
    else next.add(wordListId);
    setExplicitListIds(next);
  };

  const save = async (): Promise<SaveWordResult> => {
    const pinyin = selectedReading?.pinyin ?? toNumberedPinyin(manualPinyin);
    if (!containsChineseCharacters(traditional) || meanings.length === 0 || !pinyin) {
      showMessage('Missing details', 'Enter Chinese characters, pinyin and at least one meaning.');
      return SaveWordResult.NotSaved;
    }
    const selectedLists = lists.filter((list) => selectedListIds.has(list.id));
    const listIdsAlreadyContainingWord = new Set(
      await wordListRepository.listIdsContainingCharacter([...selectedListIds], traditional),
    );
    const plan = planWordAddition({
      traditional,
      selectedLists,
      formMeanings: meanings,
      hasUserEditedMeanings,
      definitionCandidates: selectedReading?.definitionCandidates ?? [],
      wordPartsOfSpeech: partsOfSpeechOf(selectedReading ? [selectedReading] : []),
      listIdsAlreadyContainingWord,
    });
    const additions = await confirmedAdditions(plan);
    if (additions.length === 0) return SaveWordResult.NotSaved;

    const word = await wordRepository.findOrCreateWord({
      profileId,
      traditional,
      simplified: selectedReading?.simplified,
      pinyin,
      definitions: meanings,
    });
    await wordListRepository.addWordToLists(
      word.id,
      additions.map(({ wordListId, definitionsOverride }) => ({ wordListId, definitionsOverride })),
    );
    return SaveWordResult.Saved;
  };

  return {
    traditional,
    readings,
    selectedReadingIndex,
    selectReading,
    lookUpCharacters,
    manualPinyin,
    setManualPinyin,
    meanings,
    setMeanings,
    selectedListIds,
    toggleList,
    save,
  };
}
