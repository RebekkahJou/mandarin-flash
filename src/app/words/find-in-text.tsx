import { StyleSheet, Text, TextInput, View } from 'react-native';

import { listsForAddingWords } from '../../domain/newWordsList';
import { MAX_SEARCHED_TEXT_LENGTH } from '../../services/textWordFinder';
import {
  addFoundWordsButtonLabel,
  foundWordsNotes,
  foundWordsSummary,
} from '../../services/textWordFinderText';
import { CheckableWordRows } from '../../ui/components/CheckableWordRows';
import { ListPickerModal } from '../../ui/components/ListPickerModal';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { useFindWordsInText } from '../../ui/hooks/useFindWordsInText';
import { useWordLists } from '../../ui/hooks/useWordLists';
import { colors, fontSizes, radii, spacing } from '../../ui/theme';

const INTRO =
  'Paste or type text, such as a menu, a sign or a message, to see the dictionary words in it.';
const TEXT_INPUT_LINES = 4;
const TEXT_INPUT_MIN_HEIGHT = 120;

/** Finds the dictionary words in pasted text, so the user can add the ones they need. */
export default function FindInTextScreen() {
  const { lists } = useWordLists();
  const addableLists = listsForAddingWords(lists);
  const finder = useFindWordsInText(addableLists);
  const isFindDisabled = finder.isBusy || finder.text.trim().length === 0;
  const isAddDisabled = finder.isBusy || finder.checkedCount === 0;
  const addLabel = addFoundWordsButtonLabel(finder.checkedCount);
  const summary = finder.search ? foundWordsSummary(finder.search) : '';
  const notes = finder.search ? foundWordsNotes(finder.search) : [];
  const noteLines = notes.map((note) => (
    <Text key={note} style={styles.hint}>
      {note}
    </Text>
  ));
  const results = finder.search ? (
    <>
      <Text style={styles.summary}>{summary}</Text>
      {noteLines}
      <CheckableWordRows
        words={finder.words}
        uncheckedKeys={finder.uncheckedKeys}
        onToggle={finder.toggleWord}
      />
      <View style={styles.buttonRow}>
        <PrimaryButton
          label={addLabel}
          onPress={finder.listPicker.open}
          isDisabled={isAddDisabled}
        />
      </View>
    </>
  ) : null;

  return (
    <ScreenContainer isScrollable>
      <Text style={styles.hint}>{INTRO}</Text>
      <TextInput
        value={finder.text}
        onChangeText={finder.changeText}
        placeholder="e.g. 我要一碗牛肉麵"
        placeholderTextColor={colors.textSecondary}
        style={styles.textInput}
        maxLength={MAX_SEARCHED_TEXT_LENGTH}
        numberOfLines={TEXT_INPUT_LINES}
        textAlignVertical="top"
        multiline
        autoCorrect={false}
      />
      <View style={styles.buttonRow}>
        <PrimaryButton
          label="Find words"
          onPress={() => void finder.findWords()}
          isDisabled={isFindDisabled}
        />
      </View>
      {results}

      <ListPickerModal
        isVisible={finder.listPicker.isVisible}
        lists={addableLists}
        selectedListIds={finder.listPicker.selectedListIds}
        onToggle={finder.listPicker.toggleList}
        onClose={finder.listPicker.confirm}
        onDismiss={finder.listPicker.cancel}
        closeLabel="Add words"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  textInput: {
    minHeight: TEXT_INPUT_MIN_HEIGHT,
    fontSize: fontSizes.title,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: radii.medium,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  summary: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.small,
  },
});
