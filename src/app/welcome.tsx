import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceChips } from '../ui/components/ChoiceChips';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { ScreenContainer } from '../ui/components/ScreenContainer';
import { SectionTitle } from '../ui/components/SectionTitle';
import { useWelcome } from '../ui/hooks/useWelcome';
import { colors, fontSizes, spacing } from '../ui/theme';

export default function WelcomeScreen() {
  const welcome = useWelcome();
  const languageTabs =
    welcome.hasSeveralLanguages && welcome.selectedLanguageId ? (
      <ChoiceChips
        choices={welcome.languageTabs}
        selectedValue={welcome.selectedLanguageId}
        onSelect={welcome.selectLanguage}
      />
    ) : null;
  return (
    <ScreenContainer isScrollable>
      <SectionTitle title="Who's practicing?" />
      {languageTabs}
      <Text style={styles.language}>{welcome.selectedLanguageName}</Text>
      <View style={styles.profiles}>
        {welcome.profiles.map((profile) => (
          <PrimaryButton
            key={profile.id}
            label={profile.name}
            onPress={() => welcome.selectProfile(profile)}
            isProminent
          />
        ))}
      </View>
      <View style={styles.buttonRow}>
        <PrimaryButton
          label="Add a new user"
          onPress={() => router.push('/profiles/add')}
          isOutlined
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  language: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  profiles: {
    gap: spacing.small,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
