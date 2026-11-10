import { MAX_PROFILE_NAME_LENGTH, namesToCreate, profileNameProblem } from '../profileName';

describe('profileNameProblem', () => {
  it('accepts a new name', () => {
    expect(profileNameProblem(' Kid ', ['Me'])).toBeNull();
  });

  it('rejects blank and overly long names', () => {
    expect(profileNameProblem('   ', [])).toBe('Enter a name.');
    expect(profileNameProblem('x'.repeat(MAX_PROFILE_NAME_LENGTH + 1), [])).toMatch(/up to/);
  });

  it('rejects a name the language already has, ignoring case', () => {
    expect(profileNameProblem('me', ['Me'])).toBe(
      'There is already a profile called me for this language.',
    );
  });
});

describe('namesToCreate', () => {
  it('puts the typed name first, then copied names, each once', () => {
    expect(namesToCreate(' Kid ', ['Me', 'kid', 'Partner'])).toEqual(['Kid', 'Me', 'Partner']);
  });

  it('allows adding only copied names', () => {
    expect(namesToCreate('', ['Me'])).toEqual(['Me']);
  });
});
