import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { WordListEntry } from '../../domain/wordList';
import { definitionsForEntry } from '../../domain/wordList';
import { formatWordCount } from '../../services/wordCount';
import { ChineseText } from '../../ui/components/ChineseText';
import { InfoModal } from '../../ui/components/InfoModal';
import { ListNameModal } from '../../ui/components/ListNameModal';
import { MeaningsEditor } from '../../ui/components/MeaningsEditor';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { WordRow } from '../../ui/components/WordRow';
import {
  ListDeletionResult,
  useWordListRenameDelete,
} from '../../ui/hooks/useWordListRenameDelete';
import { useListHiding } from '../../ui/hooks/useListHiding';
import { useWordListDetail } from '../../ui/hooks/useWordListDetail';
import { colors, fontSizes, spacing } from '../../ui/theme';

const entryKey = (entry: WordListEntry) => String(entry.entryId);

export default function WordListScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const {
    list,
    mismatchedWordIds,
    mismatchWarning,
    removeEntry,
    setEntryMeanings,
    exportCsv,
    importCsv,
    reload,
  } = useWordListDetail(Number(listId));
  const renameDelete = useWordListRenameDelete(list, reload);
  const listHiding = useListHiding(list);
  const [editingEntry, setEditingEntry] = useState<WordListEntry | null>(null);
  const [editedMeanings, setEditedMeanings] = useState<string[]>([]);

  const startEditing = (entry: WordListEntry) => {
    setEditingEntry(entry);
    setEditedMeanings(definitionsForEntry(entry));
  };

  const finishEditing = async () => {
    if (editingEntry) await setEntryMeanings(editingEntry, editedMeanings);
    setEditingEntry(null);
  };

  const deleteList = async () => {
    if ((await renameDelete.deleteList()) === ListDeletionResult.Deleted) router.back();
  };
  const renameDeleteButtons = renameDelete.canRenameOrDelete ? (
    <View style={styles.buttonRow}>
      <PrimaryButton label="Rename" onPress={renameDelete.openRename} isOutlined />
      <PrimaryButton label="Delete list" onPress={() => void deleteList()} isOutlined />
    </View>
  ) : null;

  const hideList = async () => {
    if (await listHiding.hideList()) router.back();
  };
  const hideButtonRow = listHiding.canHide ? (
    <View style={styles.buttonRow}>
      <PrimaryButton label="Hide list" onPress={() => void hideList()} isOutlined />
    </View>
  ) : null;

  const screenOptions = { title: list ? `${list.name} (${list.length})` : 'Word list' };
  const isExportDisabled = !list || list.length === 0;
  const entries = list?.words ?? [];
  const mismatchCount = formatWordCount(mismatchedWordIds.size);
  const mismatchSummary =
    mismatchedWordIds.size > 0 ? (
      <Text style={styles.mismatchSummary}>
        {mismatchCount} highlighted below may not belong here. Tap ✕ to remove one, or tap the word
        to edit its meanings.
      </Text>
    ) : null;
  const isEditorVisible = editingEntry !== null;
  const editorContent = editingEntry ? (
    <>
      <ChineseText text={editingEntry.word.headword} style={styles.editingCharacter} />
      <Text style={styles.empty}>Meanings in this list only</Text>
      <MeaningsEditor meanings={editedMeanings} onChange={setEditedMeanings} />
    </>
  ) : null;

  const renderEntry = ({ item }: ListRenderItemInfo<WordListEntry>) => {
    const warning = mismatchedWordIds.has(item.word.id) ? mismatchWarning : undefined;
    const meanings = definitionsForEntry(item);
    return (
      <WordRow
        word={item.word}
        meanings={meanings}
        onPress={() => startEditing(item)}
        pressHint="Edit meanings in this list"
        onRemove={() => removeEntry(item.entryId, item.word.headword)}
        warning={warning}
      />
    );
  };

  return (
    <ScreenContainer>
      <Stack.Screen options={screenOptions} />
      <View style={styles.buttonRow}>
        <PrimaryButton label="Import CSV" onPress={importCsv} isOutlined />
        <PrimaryButton
          label="Export CSV"
          onPress={exportCsv}
          isOutlined
          isDisabled={isExportDisabled}
        />
      </View>
      {renameDeleteButtons}
      {hideButtonRow}
      {mismatchSummary}
      <FlatList
        data={entries}
        keyExtractor={entryKey}
        contentContainerStyle={styles.entries}
        ListEmptyComponent={<Text style={styles.empty}>No words in this list yet.</Text>}
        renderItem={renderEntry}
      />

      <ListNameModal
        isVisible={renameDelete.isRenameVisible}
        title="Rename list"
        confirmLabel="Save name"
        name={renameDelete.nameDraft}
        onChangeName={renameDelete.setNameDraft}
        onConfirm={() => void renameDelete.saveRename()}
        onCancel={renameDelete.closeRename}
      />
      <InfoModal isVisible={isEditorVisible} onClose={finishEditing} closeLabel="Save">
        {editorContent}
      </InfoModal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  entries: {
    gap: spacing.small,
    paddingBottom: spacing.large,
  },
  mismatchSummary: {
    fontSize: fontSizes.small,
    color: colors.warning,
  },
  empty: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  editingCharacter: {
    fontSize: fontSizes.flashcardPhrase,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
