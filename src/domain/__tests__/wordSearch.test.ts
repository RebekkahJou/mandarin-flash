import { matchesWordSearch } from '../wordSearch';
import { makeWord } from './testWords';

const student = makeWord(1, {
  headword: '學生',
  variant: '学生',
  reading: 'xue2 sheng1',
  definitions: ['student', 'schoolchild'],
});

/** Stands in for a language's folding: ignores spaces and digits. */
const ignoreSpacesAndDigits = (text: string) => text.replace(/[\s0-9]/g, '').toLowerCase();

function matches(query: string): boolean {
  return matchesWordSearch(student, query, ignoreSpacesAndDigits);
}

describe('matchesWordSearch', () => {
  it('matches everything when the query is blank', () => {
    expect(matches('   ')).toBe(true);
  });

  it('matches the headword or its variant', () => {
    expect(matches('學')).toBe(true);
    expect(matches('学生')).toBe(true);
    expect(matches('老')).toBe(false);
  });

  it('matches the reading through the language’s search key', () => {
    expect(matches('xuesheng')).toBe(true);
    expect(matches('Xue Sheng')).toBe(true);
    expect(matches('laoshi')).toBe(false);
  });

  it('ignores a query that folds to nothing', () => {
    expect(matches('123')).toBe(false);
  });

  it('matches meanings case-insensitively', () => {
    expect(matches('SCHOOL')).toBe(true);
    expect(matches('teacher')).toBe(false);
  });
});
