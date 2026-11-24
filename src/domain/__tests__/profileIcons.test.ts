import { PROFILE_ICONS, toProfileIcon } from '../profileIcons';

describe('profile icons', () => {
  it('has distinct icons, each with a spoken name', () => {
    const icons = PROFILE_ICONS.map(({ icon }) => icon);
    expect(new Set(icons).size).toBe(icons.length);
    expect(PROFILE_ICONS.every(({ name }) => name.length > 0)).toBe(true);
  });

  it('keeps only icons from the set', () => {
    expect(toProfileIcon('🐼')).toBe('🐼');
    expect(toProfileIcon('💀')).toBeUndefined();
    expect(toProfileIcon(null)).toBeUndefined();
  });
});
