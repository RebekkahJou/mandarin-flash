import { StyleSheet, Text } from 'react-native';

import type { WordList } from '../../domain/wordList';
import { colors, fontSizes } from '../theme';
import type { CheckboxOption } from './Checkboxes';
import { Checkboxes } from './Checkboxes';
import { InfoModal } from './InfoModal';
import { ListCheckboxes } from './ListCheckboxes';

interface WordSetsModalProps {
  isVisible: boolean;
  title: string;
  /** Explains where the words go. */
  hint: string;
  /** Sets to choose from, with already added ones disabled. */
  setOptions: readonly CheckboxOption<string>[];
  selectedSetIds: ReadonlySet<string>;
  onToggleSet: (setId: string) => void;
  /** Lists the words may also go into, such as Focus Vocabulary. */
  extraLists: readonly WordList[];
  selectedExtraListIds: ReadonlySet<number>;
  onToggleExtraList: (wordListId: number) => void;
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Picks topic word sets (e.g. health vocabulary) to add, and other lists for their words. */
export function WordSetsModal({
  isVisible,
  title,
  hint,
  setOptions,
  selectedSetIds,
  onToggleSet,
  extraLists,
  selectedExtraListIds,
  onToggleExtraList,
  confirmLabel,
  onConfirm,
  onDismiss,
}: WordSetsModalProps) {
  const hasExtraLists = extraLists.length > 0;
  const extraListsTitle = hasExtraLists ? (
    <Text style={styles.subtitle}>Also add the words to</Text>
  ) : null;
  const extraListCheckboxes = hasExtraLists ? (
    <ListCheckboxes
      lists={extraLists}
      selectedListIds={selectedExtraListIds}
      onToggle={(list) => onToggleExtraList(list.id)}
    />
  ) : null;
  return (
    <InfoModal
      isVisible={isVisible}
      onClose={onConfirm}
      closeLabel={confirmLabel}
      onDismiss={onDismiss}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <Checkboxes options={setOptions} selectedValues={selectedSetIds} onToggle={onToggleSet} />
      {extraListsTitle}
      {extraListCheckboxes}
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
});
