import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { FIND_IN_TEXT_PATHNAME, sharedTextInbox } from '../../services/sharedText';

/**
 * Text shared while the welcome or first-run screen shows can't open Find words in text yet, so
 * it waits in the inbox; this opens the screen once someone is in the app.
 */
export function useSharedTextAfterProfileChoice(isInApp: boolean) {
  const wasInApp = useRef(isInApp);

  useEffect(() => {
    const hasEnteredApp = isInApp && !wasInApp.current;
    wasInApp.current = isInApp;
    if (hasEnteredApp && sharedTextInbox.hasPending()) router.push(FIND_IN_TEXT_PATHNAME);
  }, [isInApp]);
}
