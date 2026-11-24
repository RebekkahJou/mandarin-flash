import { StyleSheet, Text, View } from 'react-native';

import { FIRST_PROFILE_NAME_SUGGESTIONS } from '../domain/profileNameSuggestions';
import { NewProfileFields } from '../ui/components/NewProfileFields';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { ScreenContainer } from '../ui/components/ScreenContainer';
import { LANGUAGE_CHOICES, useNewProfileForm } from '../ui/hooks/useNewProfileForm';
import { useProfileSession } from '../ui/ProfileSessionContext';
import { colors, fontSizes } from '../ui/theme';

export default function FirstRunScreen() {
  const form = useNewProfileForm(FIRST_PROFILE_NAME_SUGGESTIONS);
  const { selectProfile } = useProfileSession();
  const start = async () => {
    const [profile] = await form.submit();
    if (profile) await selectProfile(profile);
  };
  return (
    <ScreenContainer isScrollable>
      <Text style={styles.intro}>
        Welcome! Choose what to learn. You can add more people and the other kind of Mandarin later.
      </Text>
      <NewProfileFields
        languageQuestion="Which Mandarin would you like to learn?"
        languageChoices={LANGUAGE_CHOICES}
        languageId={form.languageId}
        onSelectLanguage={form.selectLanguage}
        name={form.name}
        onChangeName={form.setName}
        namePlaceholder={form.suggestedName}
        copyableNames={form.copyableNames}
        copiedNames={form.copiedNames}
        onToggleCopiedName={form.toggleCopiedName}
      />
      <View style={styles.buttonRow}>
        <PrimaryButton label="Start" onPress={start} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
