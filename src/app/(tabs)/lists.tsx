import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { WordListSummary } from '../../data/repositories/wordListRepository';
import { CompactButton } from '../../ui/components/CompactButton';
import { DraggableReorderList } from '../../ui/components/DraggableReorderList';
import { ListPickerModal } from '../../ui/components/ListPickerModal';
import { ListNameModal } from '../../ui/components/ListNameModal';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import { StarterVocabularyCard } from '../../ui/components/StarterVocabularyCard';
import { WordListRow } from '../../ui/components/WordListRow';
import { useListsTabImport } from '../../ui/hooks/useListsTabImport';
import { useStarterVocabulary } from '../../ui/hooks/useStarterVocabulary';
import { useWordListManagement } from '../../ui/hooks/useWordListManagement';
import { useWordListSummaries } from '../../ui/hooks/useWordListSummaries';
import { spacing } from '../../ui/theme';

function openList(wordListId: number) {
  router.push({ pathname: '/lists/[listId]', params: { listId: String(wordListId) } });
}

export default function WordListsScreen() {
  const { summaries, shownWordCount, refresh } = useWordListSummaries();
  const lists = summaries.map((summary) => summary.list);
  const csvImport = useListsTabImport(lists, () => void refresh());
  const management = useWordListManagement(lists, refresh);
  const starterVocabulary = useStarterVocabulary(() => void refresh());
  const starterCard = starterVocabulary.cardText ? (
    <StarterVocabularyCard
      text={starterVocabulary.cardText}
      isAdding={starterVocabulary.isAdding}
      onAdd={() => void starterVocabulary.addNextSet()}
    />
  ) : null;
  const reorderLabel = management.isReordering ? 'Done' : 'Reorder';

  const renderListRow = ({ list, length }: WordListSummary) => (
    <WordListRow
      key={list.id}
      name={list.name}
      wordCount={length}
      onPress={() => openList(list.id)}
    />
  );
  const listRows = management.isReordering ? (
    <DraggableReorderList
      items={lists}
      onReorder={(orderedIds) => void management.saveListOrder(orderedIds)}
      onDragStateChange={management.setIsDragging}
    />
  ) : (
    <View style={styles.lists}>{summaries.map(renderListRow)}</View>
  );
  const isScrollEnabled = !management.isDragging;

  return (
    <ScreenContainer isScrollable isScrollEnabled={isScrollEnabled}>
      <View style={styles.buttonRow}>
        <PrimaryButton label="Add a word" onPress={() => router.push('/words/add')} />
        <PrimaryButton label="Import CSV" onPress={csvImport.openPicker} isOutlined />
      </View>
      <WordListRow
        name="All words"
        wordCount={shownWordCount}
        isFeatured
        onPress={() => router.push('/words')}
      />
      {starterCard}
      <View style={styles.listsHeader}>
        <View style={styles.listsTitle}>
          <SectionTitle title="Your lists" />
        </View>
        <CompactButton label={reorderLabel} onPress={management.toggleReordering} isOutlined />
        <CompactButton
          label="+"
          accessibilityLabel="New word list"
          onPress={management.openCreator}
        />
      </View>
      {listRows}

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
      <ListNameModal
        isVisible={management.isCreatorVisible}
        title="New word list"
        confirmLabel="Create list"
        name={management.newListName}
        onChangeName={management.setNewListName}
        onConfirm={() => void management.createList()}
        onCancel={management.closeCreator}
        suggestedNames={management.suggestedListNames}
        onPickSuggestion={(name) => void management.createSuggestedList(name)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  listsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  listsTitle: {
    flex: 1,
  },
  lists: {
    gap: spacing.small,
  },
});
