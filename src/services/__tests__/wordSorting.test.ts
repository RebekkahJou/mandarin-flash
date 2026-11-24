import { DEFAULT_SETTINGS, PhoneticDisplay } from '../../data/repositories/settingsRepository';
import { FrequencyTier } from '../../domain/frequencyTier';
import { WordSort } from '../../domain/wordSort';
import { WordSortPlace, resolvedWordSorts, sortWords, wordSortContext } from '../wordSorting';

function row(headword: string, reading: string, meaning: string, frequencyTier: FrequencyTier) {
  return { word: { headword, reading, frequencyTier }, meanings: [meaning] };
}

// Newest first, as All words loads them.
const ROWS = [
  row('水', 'shui3', 'water', FrequencyTier.Retention),
  row('媽媽', 'ma1 ma5', 'mom', FrequencyTier.HighIncidence),
  row('八', 'ba1', 'eight', FrequencyTier.HighIncidence),
  row('人', 'ren2', 'person', FrequencyTier.MemoryReinforcement),
];
const NO_RADICALS = () => undefined;

function headwords(rows: readonly { word: { headword: string } }[]) {
  return rows.map(({ word }) => word.headword);
}

describe('sortWords', () => {
  it('keeps newest first, or sorts by pinyin, zhuyin or English', () => {
    const sortBy = (sort: WordSort) =>
      headwords(sortWords(ROWS, { sort, subSort: WordSort.Newest }, NO_RADICALS));
    expect(sortBy(WordSort.Newest)).toEqual(['水', '媽媽', '八', '人']);
    expect(sortBy(WordSort.Pinyin)).toEqual(['八', '媽媽', '人', '水']);
    expect(sortBy(WordSort.Zhuyin)).toEqual(['八', '媽媽', '水', '人']);
    expect(sortBy(WordSort.English)).toEqual(['八', '媽媽', '人', '水']);
  });

  it('sorts by learning level, then by the sub-sort within each level', () => {
    const sorted = sortWords(
      ROWS,
      { sort: WordSort.LearningLevel, subSort: WordSort.Pinyin },
      NO_RADICALS,
    );
    expect(headwords(sorted)).toEqual(['八', '媽媽', '人', '水']);
    const newestWithin = sortWords(
      ROWS,
      { sort: WordSort.LearningLevel, subSort: WordSort.Newest },
      NO_RADICALS,
    );
    expect(headwords(newestWithin)).toEqual(['媽媽', '八', '人', '水']);
  });
});

describe('resolvedWordSorts', () => {
  const definition = { wordSorts: [WordSort.Pinyin, WordSort.Radical, WordSort.Zhuyin] };

  it('treats zhuyin as in use when shown or studied', () => {
    const pinyinOnly = { phoneticDisplay: PhoneticDisplay.Pinyin, learnZhuyin: false };
    expect(wordSortContext(definition, pinyinOnly).isZhuyinInUse).toBe(false);
    expect(wordSortContext(definition, { ...pinyinOnly, learnZhuyin: true }).isZhuyinInUse).toBe(
      true,
    );
  });

  it('falls back to newest first for sorts that no longer apply', () => {
    const context = wordSortContext(definition, {
      phoneticDisplay: PhoneticDisplay.Pinyin,
      learnZhuyin: false,
    });
    const settings = {
      ...DEFAULT_SETTINGS,
      allWordsSort: WordSort.Zhuyin,
      allWordsSubSort: WordSort.English,
      wordListsSort: WordSort.Pinyin,
    };
    expect(resolvedWordSorts(context, settings, WordSortPlace.AllWords)).toEqual({
      sort: WordSort.Newest,
      subSort: WordSort.English,
    });
    expect(resolvedWordSorts(context, settings, WordSortPlace.WordLists)).toEqual({
      sort: WordSort.Pinyin,
      subSort: WordSort.Newest,
    });
  });
});
