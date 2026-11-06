import { LanguageId } from '../../domain/language';
import { matchesWordSearch } from '../../domain/wordSearch';
import { makeWord } from '../../domain/__tests__/testWords';
import { LANGUAGE_BUNDLES, languageBundleFor } from '../languages/languageBundles';
import { mandarinTraditionalBundle } from '../languages/mandarinTraditionalBundle';

describe('languageBundleFor', () => {
  it('has a bundle for every language, matching its definition', () => {
    Object.values(LanguageId).forEach((languageId) => {
      expect(LANGUAGE_BUNDLES[languageId].definition.id).toBe(languageId);
    });
  });

  it('returns the Mandarin (Traditional) bundle', () => {
    expect(languageBundleFor(LanguageId.MandarinTraditional)).toBe(mandarinTraditionalBundle);
  });
});

describe('mandarinTraditionalBundle', () => {
  const mandarin = mandarinTraditionalBundle;

  it('stores headwords as Taiwan Traditional', () => {
    expect(mandarin.normalizeHeadword(' 软件 ')).toBe('軟體');
    expect(mandarin.normalizeHeadword('學生')).toBe('學生');
  });

  it('recognizes Chinese characters', () => {
    expect(mandarin.containsLanguageScript('hello 你')).toBe(true);
    expect(mandarin.containsLanguageScript('hello')).toBe(false);
  });

  it('stores readings as numbered pinyin and shows them tone-marked', () => {
    expect(mandarin.normalizeReading('nǐ hǎo')).toBe('ni3 hao3');
    expect(mandarin.formatReading('ni3 hao3')).toBe('nǐ hǎo');
  });

  it('folds pinyin with or without tones and spaces to the same search key', () => {
    const keys = ['xuesheng', 'xue sheng', 'xué shēng', 'xue2 sheng1', 'XueSheng'].map(
      mandarin.readingSearchKey,
    );
    expect(new Set(keys)).toEqual(new Set(['xuesheng']));
  });

  it('finds a word by loosely typed pinyin', () => {
    const student = makeWord(1, { headword: '學生', reading: 'xue2 sheng1' });
    for (const query of ['xuesheng', 'xué shēng', 'Sheng']) {
      expect(matchesWordSearch(student, query, mandarin.readingSearchKey)).toBe(true);
    }
    expect(matchesWordSearch(student, 'laoshi', mandarin.readingSearchKey)).toBe(false);
  });
});
