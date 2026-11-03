import { StyleSheet, Text } from 'react-native';

import type { WordList } from '../../domain/wordList';
import { colors, fontSizes } from '../theme';
import { InfoModal } from './InfoModal';
import { ListCheckboxes } from './ListCheckboxes';

const DEFAULT_TITLE = 'Add to which lists?';

interface ListPickerModalProps {
  isVisible: boolean;
  lists: readonly WordList[];
  selectedListIds: ReadonlySet<number>;
  onToggle: (wordListId: number) => void;
  onClose: () => void;
  title?: string;
  closeLabel?: string;
  onDismiss?: () => void;
}

/** Multi-select of the lists new words should be added to. */
export function ListPickerModal({
  isVisible,
  lists,
  selectedListIds,
  onToggle,
  onClose,
  title = DEFAULT_TITLE,
  closeLabel = 'Done',
  onDismiss,
}: ListPickerModalProps) {
  return (
    <InfoModal
      isVisible={isVisible}
      onClose={onClose}
      closeLabel={closeLabel}
      onDismiss={onDismiss}
    >
      <Text style={styles.title}>{title}</Text>
      <ListCheckboxes
        lists={lists}
        selectedListIds={selectedListIds}
        onToggle={(list) => onToggle(list.id)}
      />
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
