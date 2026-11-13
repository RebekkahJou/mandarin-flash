import { StyleSheet, Text } from 'react-native';

import { colors, fontSizes } from '../theme';
import type { CheckboxOption } from './Checkboxes';
import { Checkboxes } from './Checkboxes';
import { InfoModal } from './InfoModal';

interface CharacterPartsModalProps {
  isVisible: boolean;
  compound: string;
  /** Characters that can be added, labelled with reading and meaning. */
  options: readonly CheckboxOption<string>[];
  selectedCharacters: ReadonlySet<string>;
  /** e.g. "店 is already in your words." Null when none are. */
  alreadyAddedNote: string | null;
  onToggle: (character: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
}

/** Offers a compound's characters for separate study after the compound is added. */
export function CharacterPartsModal({
  isVisible,
  compound,
  options,
  selectedCharacters,
  alreadyAddedNote,
  onToggle,
  onConfirm,
  onSkip,
}: CharacterPartsModalProps) {
  const title = `Also study the characters of ${compound}?`;
  const note = alreadyAddedNote ? <Text style={styles.note}>{alreadyAddedNote}</Text> : null;
  return (
    <InfoModal isVisible={isVisible} onClose={onConfirm} closeLabel="Done" onDismiss={onSkip}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>Ticked characters go to General Vocabulary.</Text>
      <Checkboxes options={options} selectedValues={selectedCharacters} onToggle={onToggle} />
      {note}
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  note: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
});
