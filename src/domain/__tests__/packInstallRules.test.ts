import { LanguageId } from '../language';
import type { PackMetadata } from '../packMetadata';
import type { PackSummary } from '../packInstallRules';
import { packInstallProblem, packRemovalProblem } from '../packInstallRules';

const MANDARIN: PackMetadata = {
  packId: 'mandarin',
  packVersion: 1,
  schemaVersion: 1,
  title: 'Mandarin',
  languageIds: [LanguageId.MandarinTraditional, LanguageId.MandarinSimplified],
  reliablePartsOfSpeech: [],
  licenses: [],
};

const BUILT_IN: PackSummary = { metadata: MANDARIN, isBuiltIn: true };

function installed(packVersion: number): PackSummary {
  return { metadata: { ...MANDARIN, packVersion }, isBuiltIn: false };
}

describe('packInstallProblem', () => {
  it('accepts a newer version of an open pack', () => {
    expect(packInstallProblem({ ...MANDARIN, packVersion: 2 }, [BUILT_IN])).toBeNull();
  });

  it('refuses the same or an older version', () => {
    expect(packInstallProblem(MANDARIN, [BUILT_IN])).toBe(
      'The Mandarin pack (version 1) is already installed.',
    );
    expect(packInstallProblem({ ...MANDARIN, packVersion: 2 }, [BUILT_IN, installed(3)])).toBe(
      'A newer Mandarin pack (version 3) is already installed.',
    );
  });

  it('refuses a pack only for languages this app version does not know', () => {
    const german = { ...MANDARIN, packId: 'german', title: 'German', languageIds: ['de'] };
    expect(packInstallProblem(german, [BUILT_IN])).toContain('Update the app');
  });
});

describe('packRemovalProblem', () => {
  const inUse = new Set<string>([LanguageId.MandarinSimplified]);

  it('never removes the built-in pack', () => {
    expect(packRemovalProblem(BUILT_IN, [BUILT_IN], new Set())).toBe(
      'The Mandarin pack is part of the app.',
    );
  });

  it('removes a pack when another serves its languages', () => {
    const update = installed(2);
    expect(packRemovalProblem(update, [BUILT_IN, update], inUse)).toBeNull();
  });

  it('keeps the only pack of a language that profiles use', () => {
    const update = installed(2);
    expect(packRemovalProblem(update, [update], inUse)).toBe(
      'Profiles still learn Mandarin (Simplified). Delete those profiles first.',
    );
    expect(packRemovalProblem(update, [update], new Set())).toBeNull();
  });
});
