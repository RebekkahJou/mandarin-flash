import { router, useCanGoBack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

const WORD_LISTS_TAB = '/lists';

/**
 * Going back returns to the screen the user came from (the Word lists tab or Settings). With no
 * screen behind it, such as after the app restored this screen alone, back opens the Word lists
 * tab instead of leaving the app.
 */
export function useBackToWordListsTab() {
  const canGoBack = useCanGoBack();
  const goToWordListsTab = useCallback(() => router.replace(WORD_LISTS_TAB), []);

  useFocusEffect(
    useCallback(() => {
      if (canGoBack) return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goToWordListsTab();
        return true;
      });
      return () => subscription.remove();
    }, [canGoBack, goToWordListsTab]),
  );

  return { needsOwnBackButton: !canGoBack, goToWordListsTab };
}
