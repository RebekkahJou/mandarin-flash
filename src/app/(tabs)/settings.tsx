import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PhoneticDisplay, SimplifiedDisplay } from '../../data/repositories/settingsRepository';
import { PRACTICE_SET_SIZES } from '../../domain/practiceSetBuilder';
import { WordSetTopic } from '../../domain/wordSets';
import { useAppServices, useSettings } from '../../ui/AppServicesContext';
import { Checkboxes } from '../../ui/components/Checkboxes';
import { ChoiceChips } from '../../ui/components/ChoiceChips';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import { WordSetsModal } from '../../ui/components/WordSetsModal';
import { useProfileSwitcher } from '../../ui/hooks/useProfileSwitcher';
import { useWordSets } from '../../ui/hooks/useWordSets';
import { useZhuyinStudy } from '../../ui/hooks/useZhuyinStudy';
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

const LEARN_ZHUYIN_OPTION = 'learnZhuyin';
const LEARN_ZHUYIN_OPTIONS = [
  {
    value: LEARN_ZHUYIN_OPTION,
    label: 'Learn zhuyin: adds a Zhuyin list of the 37 symbols and tone marks',
  },
];

const HEALTH_SETS_HINT =
  'Words for doctors, symptoms, medicine and more. They go into Health-related words, ' +
  'General Vocabulary and their word-type lists.';

const SET_SIZE_CHOICES = PRACTICE_SET_SIZES.map((size) => ({ value: size, label: `${size}` }));

export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();
  const { variantName } = useAppServices().languageBundle.definition;
  const profileSwitcher = useProfileSwitcher();
  const zhuyinStudy = useZhuyinStudy();
  const learnZhuyinSelection = new Set(zhuyinStudy.isOn ? [LEARN_ZHUYIN_OPTION] : []);
  const learnZhuyin = zhuyinStudy.isOffered ? (
    <Checkboxes
      options={LEARN_ZHUYIN_OPTIONS}
      selectedValues={learnZhuyinSelection}
      onToggle={zhuyinStudy.toggle}
    />
  ) : null;
  const healthWordSets = useWordSets(WordSetTopic.Health);
  const healthSection = healthWordSets.isOffered ? (
    <>
      <SectionTitle title="Health vocabulary" />
      <Text style={styles.hint}>{HEALTH_SETS_HINT}</Text>
      <View style={styles.buttonRow}>
        <PrimaryButton
          label="Add common health-related word sets"
          onPress={healthWordSets.open}
          isOutlined
          isDisabled={healthWordSets.isAdding}
        />
      </View>
    </>
  ) : null;
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
      <View style={styles.buttonRow}>
        <PrimaryButton
          label="Edit profile"
          onPress={() => router.push('/profiles/edit')}
          isOutlined
        />
      </View>

      <SectionTitle title="Pronunciation" />
      <ChoiceChips
        choices={PHONETIC_CHOICES}
        selectedValue={settings.phoneticDisplay}
        onSelect={(value) => updateSetting('phoneticDisplay', value)}
      />
      {learnZhuyin}

      <SectionTitle title={variantSectionTitle} />
      <Text style={styles.hint}>{variantHint}</Text>
      <ChoiceChips
        choices={SIMPLIFIED_CHOICES}
        selectedValue={settings.simplifiedDisplay}
        onSelect={(value) => updateSetting('simplifiedDisplay', value)}
      />

      {healthSection}

      <SectionTitle title="Default cards per set" />
      <ChoiceChips
        choices={SET_SIZE_CHOICES}
        selectedValue={settings.defaultPracticeSetSize}
        onSelect={(value) => updateSetting('defaultPracticeSetSize', value)}
      />

      <SectionTitle title="Languages" />
      <View style={styles.buttonRow}>
        <PrimaryButton label="Language packs" onPress={() => router.push('/packs')} isOutlined />
      </View>

      <SectionTitle title="Privacy" />
      <Text style={styles.hint}>
        Everything stays on this phone, in an encrypted database. The app has no internet access.
        Your words only leave the phone when you export a CSV file.
      </Text>
      <View style={styles.buttonRow}>
        <PrimaryButton label="About & licenses" onPress={() => router.push('/about')} isOutlined />
      </View>

      <WordSetsModal
        {...healthWordSets.modal}
        title="Health-related word sets"
        hint="Choose the sets you need. You can add more later."
      />
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
