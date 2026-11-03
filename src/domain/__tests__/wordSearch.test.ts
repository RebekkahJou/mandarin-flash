import { matchesWordSearch } from '../wordSearch';
import { makeWord } from './testWords';

const student = makeWord(1, {
  traditional: '學生',
  simplified: '学生',
  pinyin: 'xue2 sheng1',
  definitions: ['student', 'schoolchild'],
});

describe('matchesWordSearch', () => {
  it('matches everything when the query is blank', () => {
    expect(matchesWordSearch(student, '   ')).toBe(true);
  });

  it('matches Traditional or Simplified characters', () => {
    expect(matchesWordSearch(student, '學')).toBe(true);
    expect(matchesWordSearch(student, '学生')).toBe(true);
    expect(matchesWordSearch(student, '老')).toBe(false);
  });

  it('matches pinyin with or without tones and spaces', () => {
    for (const query of ['xuesheng', 'xue sheng', 'xué shēng', 'xue2 sheng1', 'Sheng']) {
      expect(matchesWordSearch(student, query)).toBe(true);
    }
    expect(matchesWordSearch(student, 'laoshi')).toBe(false);
  });

  it('matches meanings case-insensitively', () => {
    expect(matchesWordSearch(student, 'SCHOOL')).toBe(true);
    expect(matchesWordSearch(student, 'teacher')).toBe(false);
  });
});
