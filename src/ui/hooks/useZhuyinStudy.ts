import { useEffect, useMemo } from 'react';

import { ScriptStudySetId } from '../../domain/language';
import { WordListKind } from '../../domain/wordList';
import type { ScriptStudyListServices } from '../../services/scriptStudyList';
import {
  isZhuyinStudyOffered,
  shouldShowZhuyinList,
  syncZhuyinStudyList,
} from '../../services/scriptStudyList';
import { moveListToRetention, retentionQuestion } from '../../services/studyListHiding';
import { useAppServices, useSettings } from '../AppServicesContext';
import { confirm } from '../confirm';

const ZHUYIN_CARDS_NAME = 'zhuyin cards';

/** The "Learn zhuyin" setting, keeping the Zhuyin list shown or hidden to match it. */
export function useZhuyinStudy() {
  const { profileId, languageBundle, wordRepository, wordListRepository } = useAppServices();
  const { settings, updateSetting } = useSettings();
  const hasZhuyinCards = languageBundle.definition.scriptStudySets.some(
    (studySet) => studySet.id === ScriptStudySetId.Zhuyin,
  );
  const isVisible =
    hasZhuyinCards && shouldShowZhuyinList(settings.learnZhuyin, settings.phoneticDisplay);
  const services = useMemo<ScriptStudyListServices>(
    () => ({
      profileId,
      convertToScript: languageBundle.dictionaryForm.convertSentence,
      formatReading: languageBundle.formatReading,
      wordRepository,
      wordListRepository,
    }),
    [profileId, languageBundle, wordRepository, wordListRepository],
  );

  useEffect(() => {
    if (hasZhuyinCards) void syncZhuyinStudyList(services, isVisible);
  }, [hasZhuyinCards, isVisible, services]);

  /** Turning it off offers to move the cards to Retention; a profile without cards isn't asked. */
  const toggle = async () => {
    const isTurningOff = settings.learnZhuyin;
    const listId = isTurningOff
      ? await wordListRepository.findListIdByKind(profileId, WordListKind.ScriptStudy)
      : null;
    if (listId !== null) {
      const question = retentionQuestion(ZHUYIN_CARDS_NAME);
      const { title, message, moveLabel, keepLabel } = question;
      if (await confirm(title, message, moveLabel, keepLabel)) {
        await moveListToRetention(services, listId);
      }
    }
    updateSetting('learnZhuyin', !isTurningOff);
  };

  return {
    isOffered: hasZhuyinCards && isZhuyinStudyOffered(settings.phoneticDisplay),
    isOn: settings.learnZhuyin,
    toggle: () => void toggle(),
  };
}
