import { useMemo, useState } from 'react';

import { shouldOfferCharacterSplit } from '../../domain/compoundSplitting';
import type { PartOfSpeech } from '../../domain/partOfSpeech';
import type { Word } from '../../domain/word';
import type { CharacterPart, CharacterPartServices } from '../../services/characterParts';
import {
  addCharacterParts,
  alreadyAddedNote,
  bulkCharacterPartsQuestion,
  characterPartLabel,
  findBulkCharacterParts,
  findCharacterParts,
  partsToAdd,
} from '../../services/characterParts';
import { useAppServices } from '../AppServicesContext';
import { confirm } from '../confirm';

interface PendingSplit {
  compound: Word;
  parts: CharacterPart[];
}

/**
 * Offers to add a compound noun's characters for separate study: a checkbox dialog after adding
 * one word, or a single question after a bulk add.
 */
export function useCharacterSplit() {
  const { profileId, languageBundle, dictionaryLookup, wordRepository, wordListRepository } =
    useAppServices();
  const [pending, setPending] = useState<PendingSplit | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set());
  const [onFinished, setOnFinished] = useState<() => void>(() => () => undefined);
  const services = useMemo<CharacterPartServices>(
    () => ({
      profileId,
      isLanguageCharacter: languageBundle.containsLanguageScript,
      lookUp: dictionaryLookup.lookUp,
      wordRepository,
      wordListRepository,
    }),
    [profileId, languageBundle, dictionaryLookup, wordRepository, wordListRepository],
  );
  const { splitsCompoundsIntoCharacters } = languageBundle.definition;

  /** Opens the dialog when the word is a compound noun with characters to add; else finishes. */
  const offerForWord = async (
    compound: Word,
    wordPartsOfSpeech: readonly PartOfSpeech[],
    finish: () => void,
  ) => {
    if (
      !shouldOfferCharacterSplit(
        splitsCompoundsIntoCharacters,
        compound.headword,
        wordPartsOfSpeech,
      )
    ) {
      finish();
      return;
    }
    const parts = await findCharacterParts(services, compound.headword);
    const addable = partsToAdd(parts);
    if (addable.length === 0) {
      // Link the characters the profile already studies, without asking.
      await addCharacterParts(services, [{ compoundWordId: compound.id, parts }], new Set());
      finish();
      return;
    }
    setSelectedCharacters(new Set(addable.map((part) => part.character)));
    setOnFinished(() => finish);
    setPending({ compound, parts });
  };

  /** Asks once whether to add the characters of every compound noun in a bulk add. */
  const offerForBulkAdd = async (compounds: readonly Word[]) => {
    if (!splitsCompoundsIntoCharacters) return;
    const multiCharacter = compounds.filter((word) => Array.from(word.headword).length > 1);
    const bulk = await findBulkCharacterParts(services, multiCharacter);
    if (bulk.newCharacters.size === 0) return;
    const question = bulkCharacterPartsQuestion(bulk.newCharacters.size);
    const isAccepted = await confirm('Add individual characters?', question, 'Add characters');
    await addCharacterParts(services, bulk.compounds, isAccepted ? bulk.newCharacters : new Set());
  };

  const toggleCharacter = (character: string) => {
    const next = new Set(selectedCharacters);
    if (next.has(character)) next.delete(character);
    else next.add(character);
    setSelectedCharacters(next);
  };

  const close = async (chosen: ReadonlySet<string>) => {
    if (!pending) return;
    await addCharacterParts(
      services,
      [{ compoundWordId: pending.compound.id, parts: pending.parts }],
      chosen,
    );
    setPending(null);
    onFinished();
  };

  const options = (pending ? partsToAdd(pending.parts) : []).map((part) => ({
    value: part.character,
    label: characterPartLabel(part, languageBundle.formatReading),
  }));

  return {
    offerForWord,
    offerForBulkAdd,
    modal: {
      isVisible: pending !== null,
      compound: pending?.compound.headword ?? '',
      options,
      selectedCharacters,
      alreadyAddedNote: pending ? alreadyAddedNote(pending.parts) : null,
      onToggle: toggleCharacter,
      onConfirm: () => void close(selectedCharacters),
      onSkip: () => void close(new Set()),
    },
  };
}
