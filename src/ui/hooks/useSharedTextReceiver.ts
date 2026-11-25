import { useEffect, useRef } from 'react';

import { sharedTextInbox } from '../../services/sharedText';

/**
 * Calls onText with text shared from another app: text waiting when the screen opens, and any
 * shared while it stays open.
 */
export function useSharedTextReceiver(onText: (text: string) => void) {
  const latestOnText = useRef(onText);

  useEffect(() => {
    latestOnText.current = onText;
  });

  useEffect(() => {
    const pendingText = sharedTextInbox.take();
    if (pendingText !== null) latestOnText.current(pendingText);
    return sharedTextInbox.listen((text) => latestOnText.current(text));
  }, []);
}
