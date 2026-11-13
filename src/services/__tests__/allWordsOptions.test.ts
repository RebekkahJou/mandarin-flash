import { DEFAULT_SETTINGS } from '../../data/repositories/settingsRepository';
import {
  allWordsOptionChoices,
  allWordsViewOptions,
  hiddenByOptionsNote,
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

  it('says how many words the options hide', () => {
    expect(hiddenByOptionsNote(0)).toBeNull();
    expect(hiddenByOptionsNote(1)).toBe('1 word is hidden by your view options.');
    expect(hiddenByOptionsNote(42)).toBe('42 words are hidden by your view options.');
  });
});
