import { Stack, router } from 'expo-router';
import type { ListRenderItemInfo } from 'react-native';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import type { WordWithListIds } from '../../data/repositories/wordRepository';
import { Checkboxes } from '../../ui/components/Checkboxes';
import { CompactButton } from '../../ui/components/CompactButton';
import { InfoModal } from '../../ui/components/InfoModal';
import { ScreenContainer } from '../../ui/components/ScreenContainer';
import { WordRow } from '../../ui/components/WordRow';
import { useAllWords } from '../../ui/hooks/useAllWords';
import { colors, fontSizes, radii, spacing } from '../../ui/theme';

const wordKey = ({ word }: WordWithListIds) => String(word.id);

export default function AllWordsScreen() {
  const {
    totalWordCount,
    matchingWords,
    searchQuery,
    setSearchQuery,
    describeLists,
    showsLearningLevel,
    countText,
    options,
  } = useAllWords();
  const screenOptions = { title: 'All words' };
  const emptyMessage =
    totalWordCount === 0 ? 'No words yet.' : 'No words match your search or view options.';
  const renderWord = ({ item }: ListRenderItemInfo<WordWithListIds>) => {
    const openWord = () =>
      router.push({ pathname: '/words/[wordId]', params: { wordId: String(item.word.id) } });
    const listNames = describeLists(item.listIds);
    return (
      <WordRow
        word={item.word}
        meanings={item.meanings}
        showsEveryMeaning
        detail={listNames}
        showsLearningLevel={showsLearningLevel}
        onPress={openWord}
        pressHint="Change this word's lists and learning level"
      />
    );
  };
  return (
    <ScreenContainer>
      <Stack.Screen options={screenOptions} />
      <View style={styles.toolbar}>
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
        <CompactButton label="Options" onPress={options.open} isOutlined />
      </View>
      <Text style={styles.note}>{countText}</Text>
      <FlatList
        data={matchingWords}
        keyExtractor={wordKey}
        contentContainerStyle={styles.words}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
        renderItem={renderWord}
      />

      <InfoModal isVisible={options.isVisible} onClose={options.close} closeLabel="Done">
        <Text style={styles.optionsTitle}>View options</Text>
        <Checkboxes
          options={options.choices}
          selectedValues={options.selected}
          onToggle={options.toggle}
        />
      </InfoModal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  searchInput: {
    flex: 1,
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
  note: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
  optionsTitle: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  empty: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
  },
});
