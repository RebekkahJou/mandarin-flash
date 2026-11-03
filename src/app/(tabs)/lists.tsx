import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ListPickerModal } from '../../ui/components/ListPickerModal';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { WordListRow } from '../../ui/components/WordListRow';
import { useListsTabImport } from '../../ui/hooks/useListsTabImport';
import { useWordListSummaries } from '../../ui/hooks/useWordListSummaries';
import { spacing } from '../../ui/theme';

export default function WordListsScreen() {
  const { summaries, totalWordCount, refresh } = useWordListSummaries();
  const lists = summaries.map((summary) => summary.list);
  const csvImport = useListsTabImport(lists, () => void refresh());
  return (
    <ScreenContainer isScrollable>
      <View style={styles.buttonRow}>
        <PrimaryButton label="Add a word" onPress={() => router.push('/words/add')} />
        <PrimaryButton label="Import CSV" onPress={csvImport.openPicker} isOutlined />
      </View>
      <WordListRow
        name="All words"
        wordCount={totalWordCount}
        onPress={() => router.push('/words')}
      />
      <View style={styles.lists}>
        {summaries.map(({ list, length }) => (
          <WordListRow
            key={list.id}
            name={list.name}
            wordCount={length}
            onPress={() =>
              router.push({ pathname: '/lists/[listId]', params: { listId: String(list.id) } })
            }
          />
        ))}
      </View>

      <ListPickerModal
        isVisible={csvImport.isPickerVisible}
        title="Import into which lists?"
        lists={lists}
        selectedListIds={csvImport.selectedListIds}
        onToggle={csvImport.toggleList}
        onClose={csvImport.chooseFileAndImport}
        onDismiss={csvImport.cancel}
        closeLabel="Choose CSV file"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  lists: {
    gap: spacing.small,
  },
});
