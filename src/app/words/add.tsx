import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { toToneMarkedPinyin } from '../../services/pinyin';
import type { Choice } from '../../ui/components/ChoiceChips';
import { ChoiceChips } from '../../ui/components/ChoiceChips';
import { ChineseText } from '../../ui/components/ChineseText';
import { ListPickerModal } from '../../ui/components/ListPickerModal';
import { MeaningsEditor } from '../../ui/components/MeaningsEditor';
import { PhoneticText } from '../../ui/components/PhoneticText';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import { SaveWordResult, useAddWord } from '../../ui/hooks/useAddWord';
import { useWordListSummaries } from '../../ui/hooks/useWordListSummaries';
import { colors, fontSizes, radii, spacing } from '../../ui/theme';

export default function AddWordScreen() {
  const { summaries } = useWordListSummaries();
  const lists = summaries.map((summary) => summary.list);
  const addWord = useAddWord(lists);
  const [characterInput, setCharacterInput] = useState('');
  const [isListPickerVisible, setIsListPickerVisible] = useState(false);
  const hasLookedUp = addWord.traditional.length > 0;
  const selectedListNames = lists
    .filter((list) => addWord.selectedListIds.has(list.id))
    .map((list) => list.name)
    .join(', ');
  const readingChoices: Choice<number>[] = addWord.readings.map((reading, index) => ({
    value: index,
    label: toToneMarkedPinyin(reading.pinyin),
  }));

  const saveWord = async () => {
    if ((await addWord.save()) === SaveWordResult.Saved) router.back();
  };
  const lookUpInput = () => addWord.lookUpCharacters(characterInput);

  const selectedReading = addWord.readings[addWord.selectedReadingIndex];
  const readingChooser =
    addWord.readings.length > 1 ? (
      <ChoiceChips
        choices={readingChoices}
        selectedValue={addWord.selectedReadingIndex}
        onSelect={addWord.selectReading}
      />
    ) : null;
  const pronunciation = selectedReading ? (
    <PhoneticText numberedPinyin={selectedReading.pinyin} style={styles.phonetic} />
  ) : (
    <>
      <Text style={styles.hint}>
        Not in the dictionary. Enter the pinyin (tone marks or numbers) and a meaning.
      </Text>
      <TextInput
        value={addWord.manualPinyin}
        onChangeText={addWord.setManualPinyin}
        placeholder="e.g. xué shēng or xue2 sheng1"
        placeholderTextColor={colors.textSecondary}
        style={styles.textInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </>
  );
  const listsLabel = selectedListNames || 'No list selected';
  const wordDetails = hasLookedUp ? (
    <>
      <ChineseText text={addWord.traditional} style={styles.preview} />
      {readingChooser}
      {pronunciation}

      <SectionTitle title="Meanings" />
      <MeaningsEditor meanings={addWord.meanings} onChange={addWord.setMeanings} />

      <SectionTitle title="Lists" />
      <Text style={styles.hint}>{listsLabel}</Text>
      <View style={styles.buttonRow}>
        <PrimaryButton
          label="Choose lists"
          onPress={() => setIsListPickerVisible(true)}
          isOutlined
        />
        <PrimaryButton label="Save word" onPress={saveWord} />
      </View>
    </>
  ) : null;

  return (
    <ScreenContainer isScrollable>
      <SectionTitle title="Characters" />
      <TextInput
        value={characterInput}
        onChangeText={setCharacterInput}
        onSubmitEditing={lookUpInput}
        onBlur={lookUpInput}
        placeholder="e.g. 學生 or 学生"
        placeholderTextColor={colors.textSecondary}
        style={styles.characterInput}
        autoCorrect={false}
        returnKeyType="search"
      />

      {wordDetails}

      <ListPickerModal
        isVisible={isListPickerVisible}
        lists={lists}
        selectedListIds={addWord.selectedListIds}
        onToggle={addWord.toggleList}
        onClose={() => setIsListPickerVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  characterInput: {
    fontSize: fontSizes.heading,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  textInput: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  preview: {
    fontSize: fontSizes.flashcardPhrase,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  phonetic: {
    fontSize: fontSizes.title,
    color: colors.phonetic,
    textAlign: 'center',
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
