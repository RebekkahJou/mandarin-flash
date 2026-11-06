import type { DefaultWordListDefinition } from './defaultWordLists';
import { PartOfSpeech } from './partOfSpeech';

/** BCP 47 tags. Stored in profiles.language_id, so never change an existing value. */
export enum LanguageId {
  MandarinTraditional = 'zh-Hant',
  MandarinSimplified = 'zh-Hans',
}

export const DEFAULT_LANGUAGE_ID = LanguageId.MandarinTraditional;

export enum ScriptStudySetId {
  Zhuyin = 'zhuyin',
}

/** Optional cards for learning a writing or phonetic system itself, e.g. zhuyin symbols. */
export interface ScriptStudySet {
  id: ScriptStudySetId;
  name: string;
}

export interface LanguageDefinition {
  id: LanguageId;
  name: string;
  /** One line telling learners which variety this is, shown when choosing a language. */
  description: string;
  /** What a word's pronunciation guide is called, e.g. "pinyin". */
  readingName: string;
  /** Characters carry meaning alone, so a compound can be split into characters to study. */
  splitsCompoundsIntoCharacters: boolean;
  scriptStudySets: readonly ScriptStudySet[];
  /** Word types the dictionary tags well enough to warn when a word doesn't fit a list. */
  reliablePartsOfSpeech: readonly PartOfSpeech[];
  /** What a word's other written form is called, e.g. "Simplified" when studying Traditional. */
  variantName: string;
  /** A one-character label for the other written form, e.g. 简. */
  variantSymbol: string;
  /** Lists this language's profiles start with after the shared defaults, e.g. Measure words. */
  extraDefaultWordLists: readonly DefaultWordListDefinition[];
}

// CC-CEDICT glosses are tagged by an English heuristic that is only dependable for these.
const MANDARIN_RELIABLE_PARTS_OF_SPEECH = [
  PartOfSpeech.Noun,
  PartOfSpeech.Verb,
  PartOfSpeech.Adjective,
] as const;

const MANDARIN_EXTRA_DEFAULT_WORD_LISTS: readonly DefaultWordListDefinition[] = [
  { name: 'Measure words', partOfSpeech: PartOfSpeech.MeasureWord },
];

const MANDARIN_TRADITIONAL: LanguageDefinition = {
  id: LanguageId.MandarinTraditional,
  name: 'Mandarin (Traditional)',
  description: 'Traditional characters, with Taiwan pronunciation and words.',
  readingName: 'pinyin',
  splitsCompoundsIntoCharacters: true,
  scriptStudySets: [{ id: ScriptStudySetId.Zhuyin, name: 'Zhuyin' }],
  reliablePartsOfSpeech: MANDARIN_RELIABLE_PARTS_OF_SPEECH,
  variantName: 'Simplified',
  variantSymbol: '简',
  extraDefaultWordLists: MANDARIN_EXTRA_DEFAULT_WORD_LISTS,
};

/** Mainland conventions: Simplified characters, mainland readings and word forms. */
const MANDARIN_SIMPLIFIED: LanguageDefinition = {
  id: LanguageId.MandarinSimplified,
  name: 'Mandarin (Simplified)',
  description: 'Simplified characters, with mainland China pronunciation and words.',
  readingName: 'pinyin',
  splitsCompoundsIntoCharacters: true,
  scriptStudySets: [{ id: ScriptStudySetId.Zhuyin, name: 'Zhuyin' }],
  reliablePartsOfSpeech: MANDARIN_RELIABLE_PARTS_OF_SPEECH,
  variantName: 'Traditional',
  variantSymbol: '繁',
  extraDefaultWordLists: MANDARIN_EXTRA_DEFAULT_WORD_LISTS,
};

export const LANGUAGE_DEFINITIONS: Readonly<Record<LanguageId, LanguageDefinition>> = {
  [LanguageId.MandarinTraditional]: MANDARIN_TRADITIONAL,
  [LanguageId.MandarinSimplified]: MANDARIN_SIMPLIFIED,
};

export function isLanguageId(value: string): value is LanguageId {
  return (Object.values(LanguageId) as string[]).includes(value);
}

/** An unknown stored id falls back to the default language rather than hiding the profile. */
export function toLanguageId(value: string): LanguageId {
  return isLanguageId(value) ? value : DEFAULT_LANGUAGE_ID;
}

export function languageDefinitionFor(languageId: string): LanguageDefinition {
  return LANGUAGE_DEFINITIONS[toLanguageId(languageId)];
}
