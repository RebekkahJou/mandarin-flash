import { StyleSheet, Text } from 'react-native';

import type { Choice } from './ChoiceChips';
import { ChoiceChips } from './ChoiceChips';
import { WordSort } from '../../domain/wordSort';
import { colors, fontSizes } from '../theme';

interface WordSortPickerProps {
  sortChoices: readonly Choice<WordSort>[];
  selectedSort: WordSort;
  chooseSort: (sort: WordSort) => void;
  subSortChoices: readonly Choice<WordSort>[];
  selectedSubSort: WordSort;
  chooseSubSort: (sort: WordSort) => void;
}

/** "Sort by" chips, plus "Within each level" chips while sorting by learning level. */
export function WordSortPicker({
  sortChoices,
  selectedSort,
  chooseSort,
  subSortChoices,
  selectedSubSort,
  chooseSubSort,
}: WordSortPickerProps) {
  const subSortSection =
    selectedSort === WordSort.LearningLevel ? (
      <>
        <Text style={styles.heading}>Within each level</Text>
        <ChoiceChips
          choices={subSortChoices}
          selectedValue={selectedSubSort}
          onSelect={chooseSubSort}
        />
      </>
    ) : null;
  return (
    <>
      <Text style={styles.heading}>Sort by</Text>
      <ChoiceChips choices={sortChoices} selectedValue={selectedSort} onSelect={chooseSort} />
      {subSortSection}
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
