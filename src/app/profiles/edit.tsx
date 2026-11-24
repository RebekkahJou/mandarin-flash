import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PROFILE_ICONS } from '../../domain/profileIcons';
import { MAX_PROFILE_NAME_LENGTH } from '../../domain/profileName';
import { ChoiceChips } from '../../ui/components/ChoiceChips';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import { useEditProfile } from '../../ui/hooks/useEditProfile';
import { colors, fontSizes, radii, spacing } from '../../ui/theme';

/** The chip that clears the icon; icons themselves are never empty. */
const NO_ICON = '';
const ICON_CHOICES = [
  { value: NO_ICON, label: 'None' },
  ...PROFILE_ICONS.map(({ icon }) => ({ value: icon, label: icon })),
];
const ICON_HINT =
  'Shown with your name at the top of each screen when this phone has several profiles.';

const ORIGINAL_PROFILE_NOTE =
  "The first profile can't be deleted, so there is always someone to practice as.";

export default function EditProfileScreen() {
  const profile = useEditProfile();
  const deleteSection = profile.canDelete ? (
    <View style={styles.buttonRow}>
      <PrimaryButton label="Delete this profile" onPress={profile.remove} isOutlined />
    </View>
  ) : (
    <Text style={styles.hint}>{ORIGINAL_PROFILE_NOTE}</Text>
  );
  const selectedIcon = profile.icon ?? NO_ICON;
  const chooseIcon = (icon: string) => profile.chooseIcon(icon === NO_ICON ? null : icon);
  return (
    <ScreenContainer isScrollable>
      <SectionTitle title="Display name" />
      <TextInput
        value={profile.name}
        onChangeText={profile.setName}
        onSubmitEditing={profile.save}
        maxLength={MAX_PROFILE_NAME_LENGTH}
        style={styles.input}
        returnKeyType="done"
      />
      <Text style={styles.hint}>{profile.languageName}</Text>
      <View style={styles.buttonRow}>
        <PrimaryButton label="Save" onPress={profile.save} />
      </View>
      <SectionTitle title="Badge icon" />
      <Text style={styles.hint}>{ICON_HINT}</Text>
      <ChoiceChips choices={ICON_CHOICES} selectedValue={selectedIcon} onSelect={chooseIcon} />
      {deleteSection}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: radii.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  hint: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
