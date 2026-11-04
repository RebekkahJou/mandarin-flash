import { Stack, router } from 'expo-router';
import type { ListRenderItemInfo } from 'react-native';
import { FlatList, StyleSheet, Text, TextInput } from 'react-native';

import type { WordWithListIds } from '../../data/repositories/wordRepository';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { WordRow } from '../../ui/components/WordRow';
import { useAllWords } from '../../ui/hooks/useAllWords';
import { colors, fontSizes, radii, spacing } from '../../ui/theme';

const wordKey = ({ word }: WordWithListIds) => String(word.id);

export default function AllWordsScreen() {
  const { totalWordCount, matchingWords, searchQuery, setSearchQuery, describeLists } =
    useAllWords();
  const screenOptions = { title: `All words (${totalWordCount})` };
  const emptyMessage = totalWordCount === 0 ? 'No words yet.' : 'No words match your search.';
  const renderWord = ({ item }: ListRenderItemInfo<WordWithListIds>) => {
    const openWord = () =>
      router.push({ pathname: '/words/[wordId]', params: { wordId: String(item.word.id) } });
    const listNames = describeLists(item.listIds);
    return (
      <WordRow
        word={item.word}
        meanings={item.word.definitions}
        detail={listNames}
        onPress={openWord}
        pressHint="Change this word's lists and frequency"
      />
    );
  };
  return (
    <ScreenContainer>
      <Stack.Screen options={screenOptions} />
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
        keyExtractor={wordKey}
        contentContainerStyle={styles.words}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
        renderItem={renderWord}
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
