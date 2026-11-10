import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { PackInstallStatus, usePackInstall } from '../../ui/hooks/usePackInstall';
import { colors, fontSizes, spacing } from '../../ui/theme';

/** Opened from outside, so there may be no screen to go back to. */
function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Shown when the user opens a downloaded .mfpack file with the app. */
export default function InstallPackScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const { status, message } = usePackInstall(uri);
  const isInstalling = status === PackInstallStatus.Installing;
  const progress = isInstalling ? <ActivityIndicator color={colors.accent} size="large" /> : null;
  const doneButton = isInstalling ? null : (
    <View style={styles.buttonRow}>
      <PrimaryButton label="Done" onPress={leave} />
    </View>
  );

  return (
    <ScreenContainer>
      {progress}
      <Text style={styles.message}>{message}</Text>
      {doneButton}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    marginVertical: spacing.medium,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
