import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ENGLISH_FONT_FAMILY, colors, fontSizes, radii, spacing } from '../theme';

interface MeaningsEditorProps {
  meanings: readonly string[];
  onChange: (meanings: string[]) => void;
}

/** An editable list of English meanings: remove any, or type a new one. */
export function MeaningsEditor({ meanings, onChange }: MeaningsEditorProps) {
  const [newMeaning, setNewMeaning] = useState('');

  const addMeaning = () => {
    const trimmed = newMeaning.trim();
    if (!trimmed || meanings.includes(trimmed)) return;
    onChange([...meanings, trimmed]);
    setNewMeaning('');
  };

  const removeMeaning = (meaning: string) => {
    onChange(meanings.filter((existing) => existing !== meaning));
  };

  return (
    <View style={styles.container}>
      {meanings.map((meaning) => {
        const removeLabel = `Remove meaning ${meaning}`;
        return (
          <View key={meaning} style={styles.meaningRow}>
            <Text style={styles.meaning}>{meaning}</Text>
            <Pressable
              onPress={() => removeMeaning(meaning)}
              accessibilityRole="button"
              accessibilityLabel={removeLabel}
              hitSlop={spacing.small}
            >
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>
        );
      })}
      <TextInput
        value={newMeaning}
        onChangeText={setNewMeaning}
        onSubmitEditing={addMeaning}
        onBlur={addMeaning}
        placeholder="Add a meaning"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="done"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.small,
  },
  meaningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  meaning: {
    flex: 1,
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  remove: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    paddingLeft: spacing.medium,
  },
  input: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
});
