import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { PracticeSetSize } from '../../domain/practiceSetBuilder';
import { PRACTICE_SET_SIZES } from '../../domain/practiceSetBuilder';
import { useSettings } from '../../ui/AppServicesContext';
import { ChoiceChips } from '../../ui/components/ChoiceChips';
import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import { WordListRow } from '../../ui/components/WordListRow';
import { useWordListSummaries } from '../../ui/hooks/useWordListSummaries';
import { colors, fontSizes, spacing } from '../../ui/theme';

const SET_SIZE_CHOICES = PRACTICE_SET_SIZES.map((size) => ({ value: size, label: `${size}` }));

export default function PracticeSetupScreen() {
  const { summaries } = useWordListSummaries();
  const { settings } = useSettings();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  // Follows the default from Settings until the user picks a size here.
  const [chosenSetSize, setChosenSetSize] = useState<PracticeSetSize | null>(null);
  const setSize = chosenSetSize ?? settings.defaultPracticeSetSize;

  const selectedSummary = summaries.find((summary) => summary.list.id === selectedListId);
  const canStart = selectedSummary !== undefined && selectedSummary.length > 0;
  const emptyListHint =
    selectedSummary?.length === 0 ? (
      <Text style={styles.hint}>This list is empty. Add words from the Word lists tab.</Text>
    ) : null;
  const isStartDisabled = !canStart;

  const startPractice = () => {
    if (!selectedSummary) return;
    router.push({
      pathname: '/practice/session',
      params: { listId: String(selectedSummary.list.id), setSize: String(setSize) },
    });
  };

  return (
    <ScreenContainer isScrollable>
      <SectionTitle title="Choose a word list" />
      <View style={styles.lists}>
        {summaries.map(({ list, length }) => {
          const isSelected = list.id === selectedListId;
          return (
            <WordListRow
              key={list.id}
              name={list.name}
              wordCount={length}
              isSelected={isSelected}
              onPress={() => setSelectedListId(list.id)}
            />
          );
        })}
      </View>

      <SectionTitle title="Cards per set" />
      <ChoiceChips choices={SET_SIZE_CHOICES} selectedValue={setSize} onSelect={setChosenSetSize} />

      {emptyListHint}
      <View style={styles.startRow}>
        <PrimaryButton
          label="Start practice"
          onPress={startPractice}
          isDisabled={isStartDisabled}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lists: {
    gap: spacing.small,
  },
  hint: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
  startRow: {
    flexDirection: 'row',
  },
});
