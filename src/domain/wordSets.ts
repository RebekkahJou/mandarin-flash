import {
  GENERAL_VOCABULARY_LIST_NAME,
  PHRASES_LIST_NAME,
  TIME_WORDS_LIST_NAME,
} from './defaultWordLists';
import type { LanguageId } from './language';
import type { WordList } from './wordList';
import { WordListKind } from './wordList';

/**
 * Optional topic word sets shipped in a language pack, such as health vocabulary. A profile adds
 * the sets it needs; each set's words are copied into the profile's lists.
 */

/** Stored in the pack's word_sets.topic column. Declared in display order. */
export enum WordSetTopic {
  Health = 'health',
  Parenting = 'parenting',
  Caregiving = 'caregiving',
  Travel = 'travel',
  Food = 'food',
  Errands = 'errands',
  School = 'school',
  Work = 'work',
}

export const WORD_SET_TOPICS: readonly WordSetTopic[] = Object.values(WordSetTopic);

export const WORD_SET_TOPIC_TITLES: Readonly<Record<WordSetTopic, string>> = {
  [WordSetTopic.Health]: 'Health',
  [WordSetTopic.Parenting]: 'Parenting',
  [WordSetTopic.Caregiving]: 'Caregiving',
  [WordSetTopic.Travel]: 'Travel & transport',
  [WordSetTopic.Food]: 'Food & dining',
  [WordSetTopic.Errands]: 'Daily errands',
  [WordSetTopic.School]: 'School',
  [WordSetTopic.Work]: 'Work',
};

/**
 * The list that collects every word of a topic's sets. It is made when the profile adds the
 * topic's first set, and made again if it was deleted.
 */
export const WORD_SET_TOPIC_LIST_NAMES: Readonly<Record<WordSetTopic, string>> = {
  [WordSetTopic.Health]: 'Health-related words',
  [WordSetTopic.Parenting]: 'Parenting words',
  [WordSetTopic.Caregiving]: 'Caregiving words',
  [WordSetTopic.Travel]: 'Travel words',
  [WordSetTopic.Food]: 'Food and dining words',
  [WordSetTopic.Errands]: 'Errand words',
  [WordSetTopic.School]: 'School words',
  [WordSetTopic.Work]: 'Work words',
};

/** Separates language ids in the pack's word_set_entries.languages column. */
export const WORD_SET_LANGUAGE_SEPARATOR = ',';

/** An empty languages value means the entry is for every language the pack serves. */
export function isWordSetEntryForLanguage(languages: string, languageId: LanguageId): boolean {
  if (languages === '') return true;
  return languages.split(WORD_SET_LANGUAGE_SEPARATOR).includes(languageId);
}

/** Lists every added word goes into automatically, so they aren't offered as extra choices. */
const AUTOMATIC_LIST_NAMES = new Set(
  [
    GENERAL_VOCABULARY_LIST_NAME,
    PHRASES_LIST_NAME,
    TIME_WORDS_LIST_NAME,
    ...Object.values(WORD_SET_TOPIC_LIST_NAMES),
  ].map((name) => name.toLowerCase()),
);

/**
 * Lists the user may also add a set's words to, such as Focus Vocabulary or their own lists.
 * Word-type lists are filled automatically, and study lists don't hold words.
 */
export function extraListChoicesForWordSets(lists: readonly WordList[]): WordList[] {
  return lists.filter(
    (list) =>
      list.kind === WordListKind.General && !AUTOMATIC_LIST_NAMES.has(list.name.toLowerCase()),
  );
}

/** The same word in several chosen sets (醫生, 藥局) is added once, at its first appearance. */
export function withoutRepeatedWords<Entry extends { headword: string; reading: string }>(
  entries: readonly Entry[],
): Entry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.headword}\u0000${entry.reading}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
