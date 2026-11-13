import { ComponentsWordList } from '../componentsWordList';
import { GeneralWordList } from '../generalWordList';
import { LanguageId } from '../language';
import { PartOfSpeech } from '../partOfSpeech';
import { PartOfSpeechWordList } from '../partOfSpeechWordList';
import {
  extraListChoicesForWordSets,
  isWordSetEntryForLanguage,
  withoutRepeatedWords,
} from '../wordSets';

describe('isWordSetEntryForLanguage', () => {
  it('treats an empty value as every language', () => {
    expect(isWordSetEntryForLanguage('', LanguageId.MandarinSimplified)).toBe(true);
  });

  it('matches only the listed languages', () => {
    expect(isWordSetEntryForLanguage('zh-Hant', LanguageId.MandarinTraditional)).toBe(true);
    expect(isWordSetEntryForLanguage('zh-Hant', LanguageId.MandarinSimplified)).toBe(false);
    expect(isWordSetEntryForLanguage('zh-Hans,zh-Hant', LanguageId.MandarinTraditional)).toBe(true);
  });
});

describe('extraListChoicesForWordSets', () => {
  it('offers Focus Vocabulary and own lists, not lists that are filled automatically', () => {
    const lists = [
      new GeneralWordList({ id: 1, profileId: 1, name: 'General Vocabulary' }),
      new GeneralWordList({ id: 2, profileId: 1, name: 'Focus Vocabulary' }),
      new PartOfSpeechWordList({
        id: 3,
        profileId: 1,
        name: 'Nouns',
        partOfSpeech: PartOfSpeech.Noun,
      }),
      new GeneralWordList({ id: 4, profileId: 1, name: 'Phrases' }),
      new GeneralWordList({ id: 5, profileId: 1, name: 'health-related words' }),
      new ComponentsWordList({ id: 6, profileId: 1, name: 'Components' }),
      new GeneralWordList({ id: 7, profileId: 1, name: 'Trip to Tainan' }),
    ];
    expect(extraListChoicesForWordSets(lists).map((list) => list.id)).toEqual([2, 7]);
  });
});

describe('withoutRepeatedWords', () => {
  it('keeps the first of each headword and reading', () => {
    const entries = [
      { headword: '醫生', reading: 'yi1 sheng1', setId: 'doctor' },
      { headword: '行', reading: 'xing2', setId: 'doctor' },
      { headword: '醫生', reading: 'yi1 sheng1', setId: 'dental' },
      { headword: '行', reading: 'hang2', setId: 'dental' },
    ];
    expect(withoutRepeatedWords(entries).map((entry) => entry.setId)).toEqual([
      'doctor',
      'doctor',
      'dental',
    ]);
  });
});
