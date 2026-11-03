import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BUNDLED_CHINESE_FONTS } from '../services/fontRotation';
import { AppServicesProvider, useAppServicesLoader } from '../ui/AppServicesContext';
import { colors, fontSizes, spacing } from '../ui/theme';

export default function RootLayout() {
  const [areFontsLoaded] = useFonts(BUNDLED_CHINESE_FONTS);
  const servicesState = useAppServicesLoader();

  if (servicesState.status === 'failed') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Mandarin Flash could not start</Text>
        <Text style={styles.errorMessage}>{servicesState.errorMessage}</Text>
      </View>
    );
  }
  if (servicesState.status === 'loading' || !areFontsLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <AppServicesProvider services={servicesState.services}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="practice/session" options={{ title: 'Practice' }} />
        <Stack.Screen name="lists/[listId]" options={{ title: 'Word list' }} />
        <Stack.Screen name="words/add" options={{ title: 'Add a word' }} />
        <Stack.Screen name="about" options={{ title: 'About & licenses' }} />
      </Stack>
    </AppServicesProvider>
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
