import { Alert } from 'react-native';

import type { PlannedListAddition } from '../services/wordAdditionPlanner';

/** Promise-based confirmation dialog, so several warnings can be asked one after another. */
export function confirm(
  title: string,
  message: string,
  confirmLabel = 'Continue',
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function showMessage(title: string, message: string): void {
  Alert.alert(title, message);
}

/** Asks the user about each warning; a list is skipped if any of its warnings is declined. */
export async function confirmPlannedAdditions(
  plan: readonly PlannedListAddition[],
): Promise<PlannedListAddition[]> {
  const confirmed: PlannedListAddition[] = [];
  for (const addition of plan) {
    let isAccepted = true;
    for (const warning of addition.warnings) {
      isAccepted = isAccepted && (await confirm('Please confirm', warning.message, 'Add anyway'));
    }
    if (isAccepted) confirmed.push(addition);
  }
  return confirmed;
}
