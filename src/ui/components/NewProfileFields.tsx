import { StyleSheet, Text, TextInput } from 'react-native';

import type { LanguageId } from '../../domain/language';
import { LANGUAGE_DEFINITIONS } from '../../domain/language';
import { MAX_PROFILE_NAME_LENGTH } from '../../domain/profileName';
import { colors, fontSizes, radii, spacing } from '../theme';
import { Checkboxes } from './Checkboxes';
import type { Choice } from './ChoiceChips';
import { ChoiceChips } from './ChoiceChips';
import { SectionTitle } from './SectionTitle';

interface NewProfileFieldsProps {
  languageQuestion: string;
  languageChoices: readonly Choice<LanguageId>[];
  languageId: LanguageId;
  onSelectLanguage: (languageId: LanguageId) => void;
  name: string;
  onChangeName: (name: string) => void;
  namePlaceholder: string;
  /** Other languages' profile names; shown as checkboxes only when there are some. */
  copyableNames: readonly string[];
  copiedNames: ReadonlySet<string>;
  onToggleCopiedName: (name: string) => void;
}

/** The language, name and names-to-copy fields shared by first run and "Add a new user". */
export function NewProfileFields({
  languageQuestion,
  languageChoices,
  languageId,
  onSelectLanguage,
  name,
  onChangeName,
  namePlaceholder,
  copyableNames,
  copiedNames,
  onToggleCopiedName,
}: NewProfileFieldsProps) {
  const languageDescription = LANGUAGE_DEFINITIONS[languageId].description;
  const copyOptions = copyableNames.map((copyableName) => ({
    value: copyableName,
    label: copyableName,
  }));
  const copySection =
    copyOptions.length > 0 ? (
      <>
        <SectionTitle title="Also add" />
        <Text style={styles.hint}>People who already learn another language here:</Text>
        <Checkboxes
          options={copyOptions}
          selectedValues={copiedNames}
          onToggle={onToggleCopiedName}
        />
      </>
    ) : null;
  return (
    <>
      <SectionTitle title={languageQuestion} />
      <ChoiceChips
        choices={languageChoices}
        selectedValue={languageId}
        onSelect={onSelectLanguage}
      />
      <Text style={styles.hint}>{languageDescription}</Text>

      <SectionTitle title="Name" />
      <TextInput
        value={name}
        onChangeText={onChangeName}
        placeholder={namePlaceholder}
        placeholderTextColor={colors.textSecondary}
        maxLength={MAX_PROFILE_NAME_LENGTH}
        style={styles.input}
        returnKeyType="done"
      />
      {copySection}
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  input: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
});
