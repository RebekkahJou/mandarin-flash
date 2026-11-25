import { StyleSheet, View } from 'react-native';

import type { CheckableWord } from './CheckableWordRows';
import { CheckableWordRows } from './CheckableWordRows';
import { CompactButton } from './CompactButton';

export type WordSetPreviewEntry = CheckableWord;

export interface WordSetPreviewListProps {
  entries: readonly WordSetPreviewEntry[];
  /** Keys of the words the user unchecked; every other word is checked. */
  skippedKeys: ReadonlySet<string>;
  onToggleEntry: (entryKey: string) => void;
  /** Returns to the sets, keeping the checked words. */
  onBack: () => void;
}

/** One set's words, all checked to start, so the user can leave out words they don't need. */
export function WordSetPreviewList({
  entries,
  skippedKeys,
  onToggleEntry,
  onBack,
}: WordSetPreviewListProps) {
  return (
    <>
      <View style={styles.backRow}>
        <CompactButton label="Back to sets" onPress={onBack} isOutlined />
      </View>
      <CheckableWordRows words={entries} uncheckedKeys={skippedKeys} onToggle={onToggleEntry} />
    </>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
  },
});
