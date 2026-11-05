import {
  DEFAULT_LANGUAGE_ID,
  LANGUAGE_DEFINITIONS,
  LanguageId,
  ScriptStudySetId,
  isLanguageId,
  languageDefinitionFor,
} from '../language';
import { PartOfSpeech } from '../partOfSpeech';

describe('LANGUAGE_DEFINITIONS', () => {
  it('defines every language under its own id', () => {
    Object.values(LanguageId).forEach((languageId) => {
      expect(LANGUAGE_DEFINITIONS[languageId].id).toBe(languageId);
    });
  });

  it('describes Mandarin (Traditional)', () => {
    const mandarin = LANGUAGE_DEFINITIONS[LanguageId.MandarinTraditional];
    expect(mandarin.readingName).toBe('pinyin');
    expect(mandarin.splitsCompoundsIntoCharacters).toBe(true);
    expect(mandarin.scriptStudySets.map((set) => set.id)).toEqual([ScriptStudySetId.Zhuyin]);
    expect(mandarin.reliablePartsOfSpeech).toEqual([
      PartOfSpeech.Noun,
      PartOfSpeech.Verb,
      PartOfSpeech.Adjective,
    ]);
  });
});

describe('isLanguageId', () => {
  it('accepts known ids only', () => {
    expect(isLanguageId('zh-Hant')).toBe(true);
    expect(isLanguageId('zh-Hans')).toBe(false);
    expect(isLanguageId('')).toBe(false);
  });
});

describe('languageDefinitionFor', () => {
  it('finds a known language', () => {
    expect(languageDefinitionFor('zh-Hant').id).toBe(LanguageId.MandarinTraditional);
  });

  it('falls back to the default language for an unknown id', () => {
    expect(languageDefinitionFor('xx').id).toBe(DEFAULT_LANGUAGE_ID);
  });
});
