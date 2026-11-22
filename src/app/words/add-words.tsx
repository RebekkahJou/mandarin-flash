import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { listsForAddingWords } from '../../domain/newWordsList';
import { HeaderBackButton } from '../../ui/components/HeaderBackButton';
import { ListPickerModal } from '../../ui/components/ListPickerModal';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { StarterVocabularyCard } from '../../ui/components/StarterVocabularyCard';
import { WordSetsModal } from '../../ui/components/WordSetsModal';
import { useAddWordsImport } from '../../ui/hooks/useAddWordsImport';
import { useBackToWordListsTab } from '../../ui/hooks/useBackToWordListsTab';
import { useStarterVocabulary } from '../../ui/hooks/useStarterVocabulary';
import { useWordLists } from '../../ui/hooks/useWordLists';
import { useWordSets } from '../../ui/hooks/useWordSets';
import { spacing } from '../../ui/theme';

/** Every way to add words: one at a time, a CSV file, topic word sets and starter vocabulary. */
export default function AddWordsScreen() {
  const { lists, refresh } = useWordLists();
  const importableLists = listsForAddingWords(lists);
  const csvImport = useAddWordsImport(lists, () => void refresh());
  const starterVocabulary = useStarterVocabulary(() => void refresh());
  const wordSets = useWordSets(() => void refresh());
  const back = useBackToWordListsTab();

  const ownBackButton = () => <HeaderBackButton onPress={back.goToWordListsTab} />;
  const screenOptions = { headerLeft: back.needsOwnBackButton ? ownBackButton : undefined };
  const wordSetsButton = wordSets.isOffered ? (
    <View style={styles.buttonRow}>
      <PrimaryButton
        label="Add topic word sets"
        onPress={wordSets.open}
        isOutlined
        isDisabled={wordSets.isAdding}
      />
    </View>
  ) : null;
  const starterCard = starterVocabulary.cardText ? (
    <StarterVocabularyCard
      text={starterVocabulary.cardText}
      isAdding={starterVocabulary.isAdding}
      onAdd={() => void starterVocabulary.addNextSet()}
    />
  ) : null;

  return (
    <ScreenContainer isScrollable>
      <Stack.Screen options={screenOptions} />
      <View style={styles.buttonRow}>
        <PrimaryButton label="Add a word" onPress={() => router.push('/words/add')} />
      </View>
      <View style={styles.buttonRow}>
        <PrimaryButton label="Import CSV" onPress={csvImport.openPicker} isOutlined />
      </View>
      {wordSetsButton}
      {starterCard}

      <ListPickerModal
        isVisible={csvImport.isPickerVisible}
        title="Import into which lists?"
        lists={importableLists}
        selectedListIds={csvImport.selectedListIds}
        onToggle={csvImport.toggleList}
        onClose={csvImport.chooseFileAndImport}
        onDismiss={csvImport.cancel}
        closeLabel="Choose CSV file"
      />
      <WordSetsModal {...wordSets.modal} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.small,
  },
});
