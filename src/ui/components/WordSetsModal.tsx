import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WordList } from '../../domain/wordList';
import type { WordSetTopic } from '../../domain/wordSets';
import { colors, fontSizes, spacing } from '../theme';
import { CheckboxMark } from './CheckboxMark';
import type { CheckboxOption } from './Checkboxes';
import { CompactButton } from './CompactButton';
import { InfoModal } from './InfoModal';
import { ListCheckboxes } from './ListCheckboxes';
import { PrimaryButton } from './PrimaryButton';
import type { WordSetPreviewListProps } from './WordSetPreviewList';
import { WordSetPreviewList } from './WordSetPreviewList';

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
  /** Opens a set's words so the user can uncheck the ones they don't need. */
  onPreviewSet: (setId: string) => void;
  /** The previewed set's words, or null while the topics or sets show. */
  preview: WordSetPreviewListProps | null;
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
  | 'preview'
  | 'confirmLabel'
  | 'onConfirm'
  | 'onDismiss'
>;

interface SetRowProps {
  option: CheckboxOption<string>;
  isSelected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}

/** A set's checkbox, with a Preview button while the set can still be added. */
function SetRow({ option, isSelected, onToggle, onPreview }: SetRowProps) {
  const isDisabled = option.isDisabled === true;
  const isChecked = isDisabled || isSelected;
  const accessibilityState = { checked: isChecked, disabled: isDisabled };
  const labelStyle = [styles.setLabel, isDisabled && styles.disabledLabel];
  const previewButton = isDisabled ? null : (
    <CompactButton label="Preview" onPress={onPreview} isOutlined />
  );
  return (
    <View style={styles.setRow}>
      <Pressable
        onPress={onToggle}
        disabled={isDisabled}
        accessibilityRole="checkbox"
        accessibilityState={accessibilityState}
        style={styles.setCheckbox}
      >
        <CheckboxMark isChecked={isChecked} isDisabled={isDisabled} />
        <Text style={labelStyle}>{option.label}</Text>
      </Pressable>
      {previewButton}
    </View>
  );
}

function SetChoices({
  onBack,
  setOptions,
  selectedSetIds,
  onToggleSet,
  onPreviewSet,
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
      {setOptions.map((option) => (
        <SetRow
          key={option.value}
          option={option}
          isSelected={selectedSetIds.has(option.value)}
          onToggle={() => onToggleSet(option.value)}
          onPreview={() => onPreviewSet(option.value)}
        />
      ))}
      {extraListsTitle}
      {extraListCheckboxes}
    </>
  );
}

function ModalContent(props: WordSetsModalProps) {
  if (props.preview) return <WordSetPreviewList {...props.preview} />;
  if (props.isChoosingTopic) return <TopicList {...props} />;
  return <SetChoices {...props} />;
}

/**
 * Picks a topic (health, parenting…), then word sets to add and other lists for their words. A
 * set's preview shows its words to uncheck, then returns to the sets with every choice kept.
 */
export function WordSetsModal(props: WordSetsModalProps) {
  const { isVisible, title, hint, confirmLabel, onConfirm, onDismiss } = props;
  return (
    <InfoModal
      isVisible={isVisible}
      onClose={onConfirm}
      closeLabel={confirmLabel}
      onDismiss={onDismiss}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <ModalContent {...props} />
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
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  setCheckbox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    paddingVertical: spacing.small,
  },
  setLabel: {
    flexShrink: 1,
    fontSize: fontSizes.body,
    color: colors.textPrimary,
  },
  disabledLabel: {
    color: colors.textSecondary,
  },
});
