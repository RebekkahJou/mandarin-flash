import { useEffect, useMemo } from 'react';

import { ScriptStudySetId } from '../../domain/language';
import type { ScriptStudyListServices } from '../../services/scriptStudyList';
import {
  isZhuyinStudyOffered,
  shouldShowZhuyinList,
  syncZhuyinStudyList,
} from '../../services/scriptStudyList';
import { useAppServices, useSettings } from '../AppServicesContext';

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

  return {
    isOffered: hasZhuyinCards && isZhuyinStudyOffered(settings.phoneticDisplay),
    isOn: settings.learnZhuyin,
    toggle: () => updateSetting('learnZhuyin', !settings.learnZhuyin),
  };
}
