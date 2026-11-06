import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PhoneticDisplay, SimplifiedDisplay } from '../../data/repositories/settingsRepository';
import { PRACTICE_SET_SIZES } from '../../domain/practiceSetBuilder';
import { useAppServices, useSettings } from '../../ui/AppServicesContext';
import { ChoiceChips } from '../../ui/components/ChoiceChips';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import { useProfileSwitcher } from '../../ui/hooks/useProfileSwitcher';
import { colors, fontSizes } from '../../ui/theme';

const PHONETIC_CHOICES = [
  { value: PhoneticDisplay.Pinyin, label: 'Pinyin' },
  { value: PhoneticDisplay.Zhuyin, label: 'Zhuyin ㄅㄆㄇ' },
  { value: PhoneticDisplay.Both, label: 'Both' },
];

const SIMPLIFIED_CHOICES = [
  { value: SimplifiedDisplay.Hidden, label: 'Hidden' },
  { value: SimplifiedDisplay.CornerBadge, label: 'In the corner' },
  { value: SimplifiedDisplay.ModalButton, label: 'Button' },
];

const SET_SIZE_CHOICES = PRACTICE_SET_SIZES.map((size) => ({ value: size, label: `${size}` }));

export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();
  const { variantName } = useAppServices().languageBundle.definition;
  const profileSwitcher = useProfileSwitcher();
  const variantSectionTitle = `${variantName} characters`;
  const variantHint = `How to show the ${variantName.toLowerCase()} form on flashcards, when one exists.`;
  return (
    <ScreenContainer isScrollable>
      <SectionTitle title="Profile" />
      <Text style={styles.hint}>{profileSwitcher.profileSummary}</Text>
      <View style={styles.buttonRow}>
        <PrimaryButton
          label={profileSwitcher.buttonLabel}
          onPress={profileSwitcher.onPress}
          isOutlined
        />
      </View>

      <SectionTitle title="Pronunciation" />
      <ChoiceChips
        choices={PHONETIC_CHOICES}
        selectedValue={settings.phoneticDisplay}
        onSelect={(value) => updateSetting('phoneticDisplay', value)}
      />

      <SectionTitle title={variantSectionTitle} />
      <Text style={styles.hint}>{variantHint}</Text>
      <ChoiceChips
        choices={SIMPLIFIED_CHOICES}
        selectedValue={settings.simplifiedDisplay}
        onSelect={(value) => updateSetting('simplifiedDisplay', value)}
      />

      <SectionTitle title="Default cards per set" />
      <ChoiceChips
        choices={SET_SIZE_CHOICES}
        selectedValue={settings.defaultPracticeSetSize}
        onSelect={(value) => updateSetting('defaultPracticeSetSize', value)}
      />

      <SectionTitle title="Privacy" />
      <Text style={styles.hint}>
        Everything stays on this phone, in an encrypted database. The app has no internet access.
        Your words only leave the phone when you export a CSV file.
      </Text>
      <View style={styles.buttonRow}>
        <PrimaryButton label="About & licenses" onPress={() => router.push('/about')} isOutlined />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
