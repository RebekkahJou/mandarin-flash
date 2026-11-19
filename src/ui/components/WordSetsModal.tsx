import { StyleSheet, Text, View } from 'react-native';

import type { WordList } from '../../domain/wordList';
import type { WordSetTopic } from '../../domain/wordSets';
import { colors, fontSizes, spacing } from '../theme';
import type { CheckboxOption } from './Checkboxes';
import { Checkboxes } from './Checkboxes';
import { CompactButton } from './CompactButton';
import { InfoModal } from './InfoModal';
import { ListCheckboxes } from './ListCheckboxes';
import { PrimaryButton } from './PrimaryButton';

interface WordSetTopicOption {
  value: WordSetTopic;
  /** The topic's title and number of sets, e.g. "Health (17 sets)". */
  label: string;
}

interface WordSetsModalProps {
  isVisible: boolean;
  /** True while the topics are listed; false once one is chosen and its sets show. */
  isChoosingTopic: boolean;
  title: string;
  /** Explains what to choose. */
  hint: string;
  topicOptions: readonly WordSetTopicOption[];
  onChooseTopic: (topic: WordSetTopic) => void;
  /** Returns from a topic's sets to the topics. */
  onBack: () => void;
  /** The chosen topic's sets, with already added ones disabled. */
  setOptions: readonly CheckboxOption<string>[];
  selectedSetIds: ReadonlySet<string>;
  onToggleSet: (setId: string) => void;
  /** Lists the words may also go into, such as Focus Vocabulary. */
  extraLists: readonly WordList[];
  selectedExtraListIds: ReadonlySet<number>;
  onToggleExtraList: (wordListId: number) => void;
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

type TopicListProps = Pick<WordSetsModalProps, 'topicOptions' | 'onChooseTopic'>;

function TopicList({ topicOptions, onChooseTopic }: TopicListProps) {
  return (
    <View style={styles.topics}>
      {topicOptions.map((option) => (
        <View key={option.value} style={styles.topicRow}>
          <PrimaryButton
            label={option.label}
            onPress={() => onChooseTopic(option.value)}
            isOutlined
          />
        </View>
      ))}
    </View>
  );
}

type SetChoicesProps = Omit<
  WordSetsModalProps,
  | 'isVisible'
  | 'isChoosingTopic'
  | 'title'
  | 'hint'
  | 'topicOptions'
  | 'onChooseTopic'
  | 'confirmLabel'
  | 'onConfirm'
  | 'onDismiss'
>;

function SetChoices({
  onBack,
  setOptions,
  selectedSetIds,
  onToggleSet,
  extraLists,
  selectedExtraListIds,
  onToggleExtraList,
}: SetChoicesProps) {
  const hasExtraLists = extraLists.length > 0;
  const extraListsTitle = hasExtraLists ? (
    <Text style={styles.subtitle}>Also add the words to</Text>
  ) : null;
  const extraListCheckboxes = hasExtraLists ? (
    <ListCheckboxes
      lists={extraLists}
      selectedListIds={selectedExtraListIds}
      onToggle={(list) => onToggleExtraList(list.id)}
    />
  ) : null;
  return (
    <>
      <View style={styles.backRow}>
        <CompactButton label="Back to topics" onPress={onBack} isOutlined />
      </View>
      <Checkboxes options={setOptions} selectedValues={selectedSetIds} onToggle={onToggleSet} />
      {extraListsTitle}
      {extraListCheckboxes}
    </>
  );
}

/** Picks a topic (health, parenting…), then word sets to add and other lists for their words. */
export function WordSetsModal(props: WordSetsModalProps) {
  const { isVisible, isChoosingTopic, title, hint, confirmLabel, onConfirm, onDismiss } = props;
  const content = isChoosingTopic ? <TopicList {...props} /> : <SetChoices {...props} />;
  return (
    <InfoModal
      isVisible={isVisible}
      onClose={onConfirm}
      closeLabel={confirmLabel}
      onDismiss={onDismiss}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      {content}
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.title,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
  topics: {
    gap: spacing.small,
  },
  topicRow: {
    flexDirection: 'row',
  },
  backRow: {
    flexDirection: 'row',
  },
});
