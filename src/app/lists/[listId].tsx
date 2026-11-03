import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { WordListEntry } from '../../domain/wordList';
import { definitionsForEntry } from '../../domain/wordList';
import { ChineseText } from '../../ui/components/ChineseText';
import { InfoModal } from '../../ui/components/InfoModal';
import { MeaningsEditor } from '../../ui/components/MeaningsEditor';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { WordEntryRow } from '../../ui/components/WordEntryRow';
import { useWordListDetail } from '../../ui/hooks/useWordListDetail';
import { colors, fontSizes, spacing } from '../../ui/theme';

export default function WordListScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { list, removeEntry, setEntryMeanings, exportCsv, importCsv } = useWordListDetail(
    Number(listId),
  );
  const [editingEntry, setEditingEntry] = useState<WordListEntry | null>(null);
  const [editedMeanings, setEditedMeanings] = useState<string[]>([]);

  const startEditing = (entry: WordListEntry) => {
    setEditingEntry(entry);
    setEditedMeanings(definitionsForEntry(entry));
  };

  const finishEditing = async () => {
    if (editingEntry) await setEntryMeanings(editingEntry.entryId, editedMeanings);
    setEditingEntry(null);
  };

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: list ? `${list.name} (${list.length})` : 'Word list' }} />
      <View style={styles.buttonRow}>
        <PrimaryButton label="Import CSV" onPress={importCsv} isOutlined />
        <PrimaryButton
          label="Export CSV"
          onPress={exportCsv}
          isOutlined
          isDisabled={!list || list.length === 0}
        />
      </View>
      <FlatList
        data={list?.words ?? []}
        keyExtractor={(entry) => String(entry.entryId)}
        contentContainerStyle={styles.entries}
        ListEmptyComponent={<Text style={styles.empty}>No words in this list yet.</Text>}
        renderItem={({ item }) => (
          <WordEntryRow
            entry={item}
            onEditMeanings={() => startEditing(item)}
            onRemove={() => removeEntry(item.entryId, item.word.traditional)}
          />
        )}
      />

      <InfoModal isVisible={editingEntry !== null} onClose={finishEditing} closeLabel="Save">
        {editingEntry && (
          <>
            <ChineseText text={editingEntry.word.traditional} style={styles.editingCharacter} />
            <Text style={styles.empty}>Meanings in this list only</Text>
            <MeaningsEditor meanings={editedMeanings} onChange={setEditedMeanings} />
          </>
        )}
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
