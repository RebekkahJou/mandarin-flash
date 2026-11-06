import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import type { FrequencyTier } from '../../domain/frequencyTier';
import { FREQUENCY_TIERS_IN_ORDER } from '../../domain/frequencyTier';
import { ChineseText } from '../../ui/components/ChineseText';
import type { Choice } from '../../ui/components/ChoiceChips';
import { ChoiceChips } from '../../ui/components/ChoiceChips';
import { ListCheckboxes } from '../../ui/components/ListCheckboxes';
import { PhoneticText } from '../../ui/components/PhoneticText';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { SectionTitle } from '../../ui/components/SectionTitle';
import { FREQUENCY_TIER_LABELS } from '../../ui/frequencyTierLabels';
import { useWordEditor } from '../../ui/hooks/useWordEditor';
import { ENGLISH_FONT_FAMILY, colors, fontSizes } from '../../ui/theme';

const TIER_CHOICES: Choice<FrequencyTier>[] = FREQUENCY_TIERS_IN_ORDER.map((tier) => ({
  value: tier,
  label: FREQUENCY_TIER_LABELS[tier],
}));

export default function EditWordScreen() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const { word, lists, memberListIds, setFrequencyTier, toggleList } = useWordEditor(
    Number(wordId),
  );
  if (!word) return <ScreenContainer>{null}</ScreenContainer>;

  const screenOptions = { title: word.headword };
  const meaningsText = word.definitions.join('; ');
  return (
    <ScreenContainer isScrollable>
      <Stack.Screen options={screenOptions} />
      <ChineseText text={word.headword} style={styles.character} />
      <PhoneticText numberedPinyin={word.reading} style={styles.phonetic} />
      <Text style={styles.meanings}>{meaningsText}</Text>

      <SectionTitle title="Frequency" />
      <Text style={styles.hint}>How often this word comes up in practice sets, in every list.</Text>
      <ChoiceChips
        choices={TIER_CHOICES}
        selectedValue={word.frequencyTier}
        onSelect={setFrequencyTier}
      />

      <SectionTitle title="Lists" />
      <ListCheckboxes lists={lists} selectedListIds={memberListIds} onToggle={toggleList} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  character: {
    fontSize: fontSizes.flashcardPhrase,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  phonetic: {
    fontSize: fontSizes.title,
    color: colors.phonetic,
    textAlign: 'center',
  },
  meanings: {
    fontFamily: ENGLISH_FONT_FAMILY,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  hint: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
});
