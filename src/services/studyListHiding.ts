import type { WordListRepository } from '../data/repositories/wordListRepository';
import type { WordRepository } from '../data/repositories/wordRepository';
import { FrequencyTier } from '../domain/frequencyTier';
import type { WordList } from '../domain/wordList';
import { WordListKind } from '../domain/wordList';

/**
 * Hiding study lists (Zhuyin, Components): their cards can move to Retention so they rarely come
 * up in practice. A card has one learning level, stored on the word, so every list shows it.
 */

export interface StudyListHidingServices {
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
}

export interface RetentionQuestion {
  title: string;
  message: string;
  moveLabel: string;
  keepLabel: string;
}

/**
 * Asked before a study list is hidden; e.g. cardsName "zhuyin cards". howToShowAgain is added
 * when it isn't obvious, e.g. for a list hidden from its own screen.
 */
export function retentionQuestion(cardsName: string, howToShowAgain = ''): RetentionQuestion {
  const levelsNote =
    "They'll come up rarely in practice and can be hidden from All words. Showing the list " +
    "again won't move them back; you can change a card's learning level on its screen.";
  return {
    title: `Move all ${cardsName} to Retention?`,
    message: [levelsNote, howToShowAgain].filter((sentence) => sentence !== '').join(' '),
    moveLabel: 'Move to Retention',
    keepLabel: 'Keep levels',
  };
}

/** Components can be hidden from their list's screen; Zhuyin is turned off in Settings. */
export function canHideList(list: WordList): boolean {
  return list.kind === WordListKind.Components;
}

export async function moveListToRetention(
  services: StudyListHidingServices,
  wordListId: number,
): Promise<void> {
  await services.wordRepository.setFrequencyTierForList(wordListId, FrequencyTier.Retention);
}

/** Hides the list, keeping its cards; optionally moves them to Retention first. */
export async function hideStudyList(
  services: StudyListHidingServices,
  wordListId: number,
  movesToRetention: boolean,
): Promise<void> {
  if (movesToRetention) await moveListToRetention(services, wordListId);
  await services.wordListRepository.setListHidden(wordListId, true);
}

/**
 * Shows a hidden list with this name again instead of making a second one (Components from the
 * "+" dialog). Returns false when there is none.
 */
export async function showHiddenListNamed(
  wordListRepository: WordListRepository,
  profileId: number,
  name: string,
): Promise<boolean> {
  const hiddenId = await wordListRepository.findHiddenListIdByName(profileId, name);
  if (hiddenId === null) return false;
  await wordListRepository.setListHidden(hiddenId, false);
  return true;
}
