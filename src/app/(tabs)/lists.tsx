import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '../../ui/components/PrimaryButton';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { WordListRow } from '../../ui/components/WordListRow';
import { useWordListSummaries } from '../../ui/hooks/useWordListSummaries';
import { spacing } from '../../ui/theme';

export default function WordListsScreen() {
  const { summaries } = useWordListSummaries();
  return (
    <ScreenContainer isScrollable>
      <View style={styles.buttonRow}>
        <PrimaryButton label="Add a word" onPress={() => router.push('/words/add')} />
      </View>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
  },
  lists: {
    gap: spacing.small,
  },
});
