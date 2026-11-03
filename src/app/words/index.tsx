import { Stack, router } from 'expo-router';
import { FlatList, StyleSheet, Text, TextInput } from 'react-native';

import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { WordRow } from '../../ui/components/WordRow';
import { useAllWords } from '../../ui/hooks/useAllWords';
import { colors, fontSizes, radii, spacing } from '../../ui/theme';

export default function AllWordsScreen() {
  const { totalWordCount, matchingWords, searchQuery, setSearchQuery, describeLists } =
    useAllWords();
  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: `All words (${totalWordCount})` }} />
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search characters, pinyin or meaning"
        placeholderTextColor={colors.textSecondary}
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      <FlatList
        data={matchingWords}
        keyExtractor={({ word }) => String(word.id)}
        contentContainerStyle={styles.words}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>
            {totalWordCount === 0 ? 'No words yet.' : 'No words match your search.'}
          </Text>
        }
        renderItem={({ item }) => (
          <WordRow
            word={item.word}
            meanings={item.word.definitions}
            detail={describeLists(item.listIds)}
            onPress={() =>
              router.push({ pathname: '/words/[wordId]', params: { wordId: String(item.word.id) } })
            }
            pressHint="Change this word's lists and frequency"
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    fontSize: fontSizes.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  words: {
    gap: spacing.small,
    paddingBottom: spacing.large,
  },
  empty: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
});
