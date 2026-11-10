import { StyleSheet, Text, View } from 'react-native';

import type { StarterVocabularyCardText } from '../../services/starterVocabularyText';
import { colors, fontSizes, radii, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

interface StarterVocabularyCardProps {
  text: StarterVocabularyCardText;
  isAdding: boolean;
  onAdd: () => void;
}

/** Starter set progress, with a button for the next set once it unlocks. */
export function StarterVocabularyCard({ text, isAdding, onAdd }: StarterVocabularyCardProps) {
  const progress = text.progress ? <Text style={styles.body}>{text.progress}</Text> : null;
  const note = text.note ? <Text style={styles.note}>{text.note}</Text> : null;
  const addButton = text.addLabel ? (
    <PrimaryButton label={text.addLabel} onPress={onAdd} isDisabled={isAdding} />
  ) : null;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.title}</Text>
      {progress}
      {note}
      {addButton}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.small,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: spacing.medium,
  },
  title: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  note: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
});
