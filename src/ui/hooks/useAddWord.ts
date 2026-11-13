import { useCallback, useState } from 'react';

import { defaultListIdsForNewWords } from '../../domain/defaultWordLists';
import type { PartOfSpeech } from '../../domain/partOfSpeech';
import type { Word } from '../../domain/word';
import type { WordList } from '../../domain/wordList';
import { firstMeanings } from '../../domain/wordList';
import type { DictionaryEntry } from '../../services/dictionaryLookup';
import { partsOfSpeechOf } from '../../services/dictionaryLookup';
import { planWordAddition } from '../../services/wordAdditionPlanner';
import { useAppServices } from '../AppServicesContext';
import { confirmPlannedAdditions, showMessage } from '../confirm';

export interface SavedWord {
  word: Word;
  /** Every word type of the chosen reading, from the dictionary; empty when unknown. */
  partsOfSpeech: PartOfSpeech[];
}

/** State and save logic for the Add Word screen. */
export function useAddWord(lists: readonly WordList[]) {
  const { profileId, languageBundle, dictionaryLookup, wordRepository, wordListRepository } =
    useAppServices();
  const [headword, setHeadword] = useState('');
  const [readings, setReadings] = useState<DictionaryEntry[]>([]);
  const [selectedReadingIndex, setSelectedReadingIndex] = useState(0);
  const [manualPinyin, setManualPinyin] = useState('');
  const [meanings, setMeaningsState] = useState<string[]>([]);
  const [hasUserEditedMeanings, setHasUserEditedMeanings] = useState(false);
  const [explicitListIds, setExplicitListIds] = useState<Set<number> | null>(null);

  const selectedListIds = explicitListIds ?? defaultListIdsForNewWords(lists);
  const selectedReading = readings[selectedReadingIndex] as DictionaryEntry | undefined;

  const lookUpCharacters = useCallback(
    async (input: string) => {
      const converted = languageBundle.normalizeHeadword(input);
      setHeadword(converted);
      const foundReadings = languageBundle.containsLanguageScript(converted)
        ? await dictionaryLookup.lookUp(converted)
        : [];
      setReadings(foundReadings);
      setSelectedReadingIndex(0);
      setMeaningsState(firstMeanings(foundReadings[0]?.definitionCandidates ?? []));
      setHasUserEditedMeanings(false);
    },
    [dictionaryLookup, languageBundle],
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

  /** The saved word, or null when the user cancelled or details are missing. */
  const save = async (): Promise<SavedWord | null> => {
    const reading = selectedReading?.reading ?? languageBundle.normalizeReading(manualPinyin);
    if (!languageBundle.containsLanguageScript(headword) || meanings.length === 0 || !reading) {
      showMessage('Missing details', 'Enter Chinese characters, pinyin and at least one meaning.');
      return null;
    }
    const selectedLists = lists.filter((list) => selectedListIds.has(list.id));
    const listIdsAlreadyContainingWord = new Set(
      await wordListRepository.listIdsContainingHeadword([...selectedListIds], headword),
    );
    const wordPartsOfSpeech = partsOfSpeechOf(selectedReading ? [selectedReading] : []);
    const plan = planWordAddition({
      headword,
      selectedLists,
      formMeanings: meanings,
      hasUserEditedMeanings,
      definitionCandidates: selectedReading?.definitionCandidates ?? [],
      wordPartsOfSpeech,
      reliablePartsOfSpeech: dictionaryLookup.reliablePartsOfSpeech,
      listIdsAlreadyContainingWord,
    });
    const additions = await confirmPlannedAdditions(plan);
    if (additions.length === 0) return null;

    const word = await wordRepository.findOrCreateWord({
      profileId,
      headword,
      variant: selectedReading?.variant,
      reading,
      definitions: meanings,
    });
    await wordListRepository.addWordToLists(
      word.id,
      additions.map(({ wordListId, definitionsOverride }) => ({ wordListId, definitionsOverride })),
    );
    return { word, partsOfSpeech: wordPartsOfSpeech };
  };

  return {
    headword,
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
