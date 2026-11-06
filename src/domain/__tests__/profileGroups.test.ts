import { LanguageId } from '../language';
import type { Profile } from '../profileGroups';
import { groupProfilesByLanguage, profileNamesToCopy } from '../profileGroups';

const MANDARIN = LanguageId.MandarinTraditional;
const OTHER_LANGUAGE = LanguageId.MandarinSimplified;

function makeProfile(id: number, name: string, languageId: LanguageId, lastUsedAtMs: number) {
  return { id, name, languageId, lastUsedAtMs } satisfies Profile;
}

const profiles = [
  makeProfile(1, 'Me', MANDARIN, 100),
  makeProfile(2, 'Kid', MANDARIN, 300),
  makeProfile(3, 'Me', OTHER_LANGUAGE, 500),
  makeProfile(4, 'Partner', OTHER_LANGUAGE, 200),
];

describe('groupProfilesByLanguage', () => {
  it('puts the most recently used language first, its profiles newest first', () => {
    const groups = groupProfilesByLanguage(profiles);
    expect(groups.map((group) => group.languageId)).toEqual([OTHER_LANGUAGE, MANDARIN]);
    expect(groups[0].profiles.map((profile) => profile.id)).toEqual([3, 4]);
    expect(groups[1].profiles.map((profile) => profile.id)).toEqual([2, 1]);
  });

  it('orders never-used profiles by id', () => {
    const groups = groupProfilesByLanguage([
      makeProfile(5, 'B', MANDARIN, 0),
      makeProfile(4, 'A', MANDARIN, 0),
    ]);
    expect(groups[0].profiles.map((profile) => profile.id)).toEqual([4, 5]);
  });

  it('returns no groups when there are no profiles', () => {
    expect(groupProfilesByLanguage([])).toEqual([]);
  });
});

describe('profileNamesToCopy', () => {
  it('offers other languages’ names once each, skipping names the language already has', () => {
    expect(profileNamesToCopy(profiles, MANDARIN)).toEqual(['Partner']);
    expect(profileNamesToCopy(profiles, OTHER_LANGUAGE)).toEqual(['Kid']);
  });

  it('compares names ignoring case', () => {
    const mixedCase = [makeProfile(1, 'me', MANDARIN, 1), makeProfile(2, 'ME', OTHER_LANGUAGE, 2)];
    expect(profileNamesToCopy(mixedCase, MANDARIN)).toEqual([]);
  });
});
