import { Alert } from 'react-native';

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
