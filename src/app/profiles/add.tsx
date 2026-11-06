import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { NewProfileFields } from '../../ui/components/NewProfileFields';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { LANGUAGE_CHOICES, useNewProfileForm } from '../../ui/hooks/useNewProfileForm';
import { useProfileSession } from '../../ui/ProfileSessionContext';

export default function AddProfileScreen() {
  const form = useNewProfileForm('');
  const { chooseAnotherProfile } = useProfileSession();
  // New people pick themselves on the welcome screen, which now lists them.
  const add = async () => {
    const created = await form.submit();
    if (created.length === 0) return;
    router.back();
    chooseAnotherProfile();
  };
  return (
    <ScreenContainer isScrollable>
      <NewProfileFields
        languageQuestion="What will they learn?"
        languageChoices={LANGUAGE_CHOICES}
        languageId={form.languageId}
        onSelectLanguage={form.selectLanguage}
        name={form.name}
        onChangeName={form.setName}
        namePlaceholder="e.g. Kid"
        copyableNames={form.copyableNames}
        copiedNames={form.copiedNames}
        onToggleCopiedName={form.toggleCopiedName}
      />
      <View style={styles.buttonRow}>
        <PrimaryButton label="Add" onPress={add} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
  },
});
