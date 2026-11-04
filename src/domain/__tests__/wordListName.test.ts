import { MAX_WORD_LIST_NAME_LENGTH, wordListNameProblem } from '../wordListName';

const existingNames = ['General Vocabulary', 'Verbs'];

describe('wordListNameProblem', () => {
  it('accepts a new name', () => {
    expect(wordListNameProblem('  Food  ', existingNames)).toBeNull();
  });

  it('rejects blank names', () => {
    expect(wordListNameProblem('   ', existingNames)).toBe('Enter a name for the list.');
  });

  it('rejects names over the length limit', () => {
    const longName = 'a'.repeat(MAX_WORD_LIST_NAME_LENGTH + 1);
    expect(wordListNameProblem(longName, existingNames)).toMatch(/up to/);
    expect(wordListNameProblem('a'.repeat(MAX_WORD_LIST_NAME_LENGTH), existingNames)).toBeNull();
  });

  it('rejects names already in use, ignoring case and spaces', () => {
    expect(wordListNameProblem(' verbs ', existingNames)).toBe(
      'There is already a list called verbs.',
    );
  });
});
