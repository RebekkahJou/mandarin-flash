import { StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_WORD_LIST_NAME_LENGTH } from '../../domain/wordListName';
import { colors, fontSizes, radii, spacing } from '../theme';
import { CompactButton } from './CompactButton';
import { InfoModal } from './InfoModal';
import { PrimaryButton } from './PrimaryButton';

interface ListNameModalProps {
  isVisible: boolean;
  title: string;
  confirmLabel: string;
  name: string;
  onChangeName: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  /** Ready-made lists offered when creating one, e.g. Pronouns. Tapping one creates it. */
  suggestedNames?: readonly string[];
  onPickSuggestion?: (name: string) => void;
}

/** Asks for a word list name, when creating or renaming a list. */
export function ListNameModal({
  isVisible,
  title,
  confirmLabel,
  name,
  onChangeName,
  onConfirm,
  onCancel,
  suggestedNames = [],
  onPickSuggestion,
}: ListNameModalProps) {
  const hasSuggestions = suggestedNames.length > 0 && onPickSuggestion !== undefined;
  const suggestions = hasSuggestions ? (
    <View style={styles.suggestions}>
      <Text style={styles.suggestionsTitle}>Or add a suggested list</Text>
      <View style={styles.suggestionRow}>
        {suggestedNames.map((suggestedName) => (
          <CompactButton
            key={suggestedName}
            label={suggestedName}
            onPress={() => onPickSuggestion?.(suggestedName)}
            isOutlined
          />
        ))}
      </View>
    </View>
  ) : null;
  return (
    <InfoModal isVisible={isVisible} onClose={onCancel} closeLabel="Cancel">
      <Text style={styles.title}>{title}</Text>
      <TextInput
        value={name}
        onChangeText={onChangeName}
        onSubmitEditing={onConfirm}
        placeholder="e.g. Food, Travel, Chapter 3"
        placeholderTextColor={colors.textSecondary}
        maxLength={MAX_WORD_LIST_NAME_LENGTH}
        style={styles.input}
        autoFocus
        returnKeyType="done"
      />
      <View style={styles.buttonRow}>
        <PrimaryButton label={confirmLabel} onPress={onConfirm} />
      </View>
      {suggestions}
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
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
  buttonRow: {
    flexDirection: 'row',
  },
  suggestions: {
    gap: spacing.small,
  },
  suggestionsTitle: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
});
