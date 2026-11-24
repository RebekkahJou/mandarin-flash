import { MAX_PROFILE_NAME_LENGTH } from '../profileName';
import {
  FIRST_PROFILE_NAME_SUGGESTIONS,
  OTHER_PROFILE_NAME_SUGGESTIONS,
  nameOrSuggestion,
  pickProfileNameSuggestion,
} from '../profileNameSuggestions';

describe('profile name suggestions', () => {
  it('fit the name length limit', () => {
    const all = [...FIRST_PROFILE_NAME_SUGGESTIONS, ...OTHER_PROFILE_NAME_SUGGESTIONS];
    expect(all.every((name) => name.length <= MAX_PROFILE_NAME_LENGTH)).toBe(true);
  });

  it('skips names already used in the language, ignoring case', () => {
    const suggestions = ['Minion', 'Underling'];
    expect(pickProfileNameSuggestion(suggestions, ['minion'], () => 0)).toBe('Underling');
    expect(pickProfileNameSuggestion(suggestions, [], () => 0.99)).toBe('Underling');
  });

  it('falls back to any suggestion when all are taken', () => {
    expect(pickProfileNameSuggestion(['Minion'], ['Minion'], () => 0)).toBe('Minion');
  });

  it('uses the suggestion only when nothing was typed', () => {
    expect(nameOrSuggestion('  ', 'Minion')).toBe('Minion');
    expect(nameOrSuggestion('Kid', 'Minion')).toBe('Kid');
  });
});
