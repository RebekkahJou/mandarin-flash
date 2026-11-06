import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BUNDLED_CHINESE_FONTS } from '../services/fontRotation';
import { useAppCoreLoader } from '../ui/AppServicesContext';
import { LanguagePacksProvider } from '../ui/LanguagePacksContext';
import { ProfileSessionProvider, useProfileSession } from '../ui/ProfileSessionContext';
import { colors, fontSizes, spacing } from '../ui/theme';

const STACK_SCREEN_OPTIONS = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.textPrimary,
  contentStyle: { backgroundColor: colors.background },
};

/**
 * Each group of screens is only reachable in its state: first run (no profiles yet), the welcome
 * screen (someone must pick a profile) or the app itself. When the state changes, Expo Router
 * leaves the screens that became unreachable and drops them from history.
 */
function RootStack() {
  const { showsFirstRun, showsWelcome } = useProfileSession();
  const isInApp = !showsFirstRun && !showsWelcome;
  const appRedirect = showsFirstRun ? '/first-run' : '/welcome';
  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Protected guard={isInApp} redirectTo={appRedirect}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="practice/session" options={{ title: 'Practice' }} />
        <Stack.Screen name="lists/[listId]" options={{ title: 'Word list' }} />
        <Stack.Screen name="words/index" options={{ title: 'All words' }} />
        <Stack.Screen name="words/[wordId]" options={{ title: 'Word' }} />
        <Stack.Screen name="words/add" options={{ title: 'Add a word' }} />
        <Stack.Screen name="profiles/edit" options={{ title: 'Edit profile' }} />
      </Stack.Protected>
      <Stack.Protected guard={showsWelcome} redirectTo="/">
        <Stack.Screen name="welcome" options={{ title: 'Welcome' }} />
      </Stack.Protected>
      <Stack.Protected guard={showsFirstRun} redirectTo="/">
        <Stack.Screen name="first-run" options={{ title: 'Welcome' }} />
      </Stack.Protected>
      <Stack.Screen name="profiles/add" options={{ title: 'Add a new user' }} />
      <Stack.Screen name="about" options={{ title: 'About & licenses' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [areFontsLoaded] = useFonts(BUNDLED_CHINESE_FONTS);
  const coreState = useAppCoreLoader();

  if (coreState.status === 'failed') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Mandarin Flash could not start</Text>
        <Text style={styles.errorMessage}>{coreState.errorMessage}</Text>
      </View>
    );
  }
  if (coreState.status === 'loading' || !areFontsLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <LanguagePacksProvider core={coreState.core}>
      <ProfileSessionProvider core={coreState.core}>
        <StatusBar style="dark" />
        <RootStack />
      </ProfileSessionProvider>
    </LanguagePacksProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
    gap: spacing.small,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  errorMessage: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
