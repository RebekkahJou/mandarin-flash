import { usePreventRemove } from 'expo-router';
import { useState } from 'react';

import {
  LEAVE_CHALLENGE_LABEL,
  LEAVE_CHALLENGE_MESSAGE,
  LEAVE_CHALLENGE_TITLE,
  STAY_IN_CHALLENGE_LABEL,
} from '../../services/gameText';
import { confirm } from '../confirm';

/**
 * While a challenge is under way, leaving its screen (header arrow or the phone's back button)
 * first asks "Leave this challenge?"; a finished challenge leaves without asking.
 */
export function useLeaveChallengeConfirmation(isUnderWay: boolean) {
  const [hasConfirmedLeaving, setHasConfirmedLeaving] = useState(false);
  usePreventRemove(isUnderWay && !hasConfirmedLeaving, ({ repeat }) => {
    void confirm(
      LEAVE_CHALLENGE_TITLE,
      LEAVE_CHALLENGE_MESSAGE,
      LEAVE_CHALLENGE_LABEL,
      STAY_IN_CHALLENGE_LABEL,
    ).then((isLeaving) => {
      if (!isLeaving) return;
      setHasConfirmedLeaving(true);
      repeat();
    });
  });
}
