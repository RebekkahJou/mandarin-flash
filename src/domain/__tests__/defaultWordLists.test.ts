import { canRenameOrDeleteList, defaultListIdsForNewWords } from '../defaultWordLists';
import { GeneralWordList } from '../generalWordList';

describe('defaultListIdsForNewWords', () => {
  it('selects General Vocabulary', () => {
    const lists = [
      new GeneralWordList({ id: 4, profileId: 1, name: 'Focus Vocabulary' }),
      new GeneralWordList({ id: 7, profileId: 1, name: 'General Vocabulary' }),
    ];
    expect(defaultListIdsForNewWords(lists)).toEqual(new Set([7]));
  });

  it('selects nothing when General Vocabulary is missing', () => {
    expect(defaultListIdsForNewWords([])).toEqual(new Set());
  });
});

describe('canRenameOrDeleteList', () => {
  it('protects only General Vocabulary', () => {
    const general = new GeneralWordList({ id: 1, profileId: 1, name: 'General Vocabulary' });
    const focus = new GeneralWordList({ id: 2, profileId: 1, name: 'Focus Vocabulary' });
    expect(canRenameOrDeleteList(general)).toBe(false);
    expect(canRenameOrDeleteList(focus)).toBe(true);
  });
});
