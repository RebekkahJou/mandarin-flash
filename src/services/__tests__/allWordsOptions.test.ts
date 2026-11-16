import { DEFAULT_SETTINGS } from '../../data/repositories/settingsRepository';
import {
  allWordsCountText,
  allWordsOptionChoices,
  allWordsViewOptions,
  selectedAllWordsOptions,
} from '../allWordsOptions';

describe('All words options', () => {
  it('offers card filters only when the profile has those cards', () => {
    const labels = (hasScriptStudyCards: boolean, hasComponents: boolean) =>
      allWordsOptionChoices({ scriptStudyName: 'Zhuyin', hasScriptStudyCards, hasComponents }).map(
        (choice) => choice.label,
      );
    expect(labels(true, true)).toEqual([
      'Show zhuyin cards',
      'Show components',
      'Show Retention words',
      'Show learning level',
    ]);
    expect(labels(false, false)).toEqual(['Show Retention words', 'Show learning level']);
  });

  it('reads the view options and ticked boxes from settings', () => {
    const settings = { ...DEFAULT_SETTINGS, allWordsShowsComponents: false };
    expect(allWordsViewOptions(settings)).toEqual({
      showsScriptStudyCards: true,
      showsComponents: false,
      showsRetentionWords: true,
    });
    expect(selectedAllWordsOptions(settings).has('allWordsShowsComponents')).toBe(false);
    expect(selectedAllWordsOptions(settings).has('allWordsShowsLearningLevel')).toBe(true);
  });

  it('counts shown words, noting hidden ones', () => {
    expect(allWordsCountText(148, 0)).toBe('148 words');
    expect(allWordsCountText(148, 60)).toBe('148 words (+60 hidden words)');
    expect(allWordsCountText(1, 1)).toBe('1 word (+1 hidden word)');
  });
});
