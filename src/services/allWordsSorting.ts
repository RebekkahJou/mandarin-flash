import { PhoneticDisplay } from '../data/repositories/settingsRepository';
import type { AppSettings } from '../data/repositories/settingsRepository';
import type { LanguageDefinition } from '../domain/language';
import type { RadicalPosition, SortKey, WordSortContext } from '../domain/wordSort';
import {
  WordSort,
  availableSubSorts,
  availableWordSorts,
  englishSortKey,
  learningLevelSortKey,
  radicalSortKey,
  resolveWordSort,
  sortByKey,
} from '../domain/wordSort';
import type { Word } from '../domain/word';
import { pinyinSortKey, zhuyinSortKey } from './pinyin';

/** What sorting needs of an All words row. */
export interface SortableWord {
  word: Pick<Word, 'headword' | 'reading' | 'frequencyTier'>;
  /** The meanings shown for the word; English sorts by the first. */
  meanings: readonly string[];
}

/** Looks up a character's radical and remaining strokes; undefined when the pack has none. */
export type RadicalLookup = (character: string) => RadicalPosition | undefined;

export const WORD_SORT_LABELS: Readonly<Record<WordSort, string>> = {
  [WordSort.Newest]: 'Newest first',
  [WordSort.Pinyin]: 'Pinyin A-Z',
  [WordSort.Radical]: 'Radical and strokes',
  [WordSort.Zhuyin]: 'Zhuyin ㄅㄆㄇ',
  [WordSort.English]: 'English A-Z',
  [WordSort.LearningLevel]: 'Learning level',
};

export function wordSortContext(
  definition: Pick<LanguageDefinition, 'wordSorts'>,
  settings: Pick<AppSettings, 'phoneticDisplay' | 'learnZhuyin'>,
): WordSortContext {
  return {
    languageSorts: definition.wordSorts,
    isZhuyinInUse: settings.phoneticDisplay !== PhoneticDisplay.Pinyin || settings.learnZhuyin,
  };
}

/** The saved sort and sub-sort, each falling back to newest first when it no longer applies. */
export function resolvedAllWordsSorts(
  context: WordSortContext,
  settings: Pick<AppSettings, 'allWordsSort' | 'allWordsSubSort'>,
): { sort: WordSort; subSort: WordSort } {
  return {
    sort: resolveWordSort(settings.allWordsSort, availableWordSorts(context)),
    subSort: resolveWordSort(settings.allWordsSubSort, availableSubSorts(context)),
  };
}

function sortKeyFor(sort: WordSort, item: SortableWord, radicalOf: RadicalLookup): SortKey {
  const keys: Record<WordSort, () => SortKey> = {
    [WordSort.Newest]: () => [],
    [WordSort.Pinyin]: () => pinyinSortKey(item.word.reading),
    [WordSort.Radical]: () => radicalSortKey(item.word.headword, radicalOf),
    [WordSort.Zhuyin]: () => zhuyinSortKey(item.word.reading),
    [WordSort.English]: () => englishSortKey(item.meanings),
    [WordSort.LearningLevel]: () => learningLevelSortKey(item.word.frequencyTier),
  };
  return keys[sort]();
}

/**
 * Words in the chosen order. Learning level sorts within each level by the sub-sort. The rows
 * come in newest first, which every sort keeps for words that tie.
 */
export function sortAllWords<Row extends SortableWord>(
  rows: readonly Row[],
  sorts: { sort: WordSort; subSort: WordSort },
  radicalOf: RadicalLookup,
): Row[] {
  if (sorts.sort === WordSort.Newest) return [...rows];
  return sortByKey(rows, (row) => {
    const key = sortKeyFor(sorts.sort, row, radicalOf);
    if (sorts.sort !== WordSort.LearningLevel) return key;
    return [...key, ...sortKeyFor(sorts.subSort, row, radicalOf)];
  });
}
