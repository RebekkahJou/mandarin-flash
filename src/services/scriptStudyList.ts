import { PhoneticDisplay } from '../data/repositories/settingsRepository';
import type { WordListRepository } from '../data/repositories/wordListRepository';
import type { WordRepository } from '../data/repositories/wordRepository';
import { WordListKind } from '../domain/wordList';
import { ZHUYIN_STUDY_LIST_NAME, zhuyinStudyWords } from './languages/zhuyinStudyCards';

export interface ScriptStudyListServices {
  profileId: number;
  convertToScript: (text: string) => string;
  formatReading: (numberedReading: string) => string;
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
}

/** "Learn zhuyin" is offered only when pronunciation isn't already shown as zhuyin alone. */
export function isZhuyinStudyOffered(phoneticDisplay: PhoneticDisplay): boolean {
  return phoneticDisplay !== PhoneticDisplay.Zhuyin;
}

export function shouldShowZhuyinList(
  learnZhuyin: boolean,
  phoneticDisplay: PhoneticDisplay,
): boolean {
  return learnZhuyin && isZhuyinStudyOffered(phoneticDisplay);
}

async function createZhuyinList(services: ScriptStudyListServices): Promise<void> {
  const { profileId, wordRepository, wordListRepository } = services;
  const wordListId = await wordListRepository.createList(profileId, {
    name: ZHUYIN_STUDY_LIST_NAME,
    kind: WordListKind.ScriptStudy,
  });
  const words = zhuyinStudyWords(services.convertToScript, services.formatReading);
  for (const card of words) {
    const word = await wordRepository.findOrCreateWord({ profileId, ...card });
    await wordListRepository.addWordToLists(word.id, [{ wordListId }]);
  }
}

/**
 * Shows the Zhuyin list (creating and filling it the first time) or hides it. Hiding keeps its
 * cards and their progress for when it is turned on again.
 */
export async function syncZhuyinStudyList(
  services: ScriptStudyListServices,
  isVisible: boolean,
): Promise<void> {
  const { profileId, wordListRepository } = services;
  const existingId = await wordListRepository.findListIdByKind(profileId, WordListKind.ScriptStudy);
  if (existingId !== null) {
    await wordListRepository.setListHidden(existingId, !isVisible);
    return;
  }
  if (isVisible) await createZhuyinList(services);
}
