import { makeWord } from '../../domain/__tests__/testWords';
import type { DictionaryEntry } from '../dictionaryLookup';
import { mandarinTraditionalBundle } from '../languages/mandarinTraditionalBundle';
import type { TextWordFinderServices } from '../textWordFinder';
import {
  MAX_SEARCHED_TEXT_LENGTH,
  findWordsInText,
  foundWordsToImportRows,
} from '../textWordFinder';

function entryFor(headword: string, reading: string, meaning: string): DictionaryEntry {
  return { headword, reading, definitionCandidates: [{ text: meaning, partsOfSpeech: [] }] };
}

const DICTIONARY = new Map<string, DictionaryEntry>([
  ['牛肉麵', entryFor('牛肉麵', 'niu2 rou4 mian4', 'beef noodles')],
  ['牛肉', entryFor('牛肉', 'niu2 rou4', 'beef')],
  ['好吃', entryFor('好吃', 'hao3 chi1', 'tasty')],
  ['計程車', entryFor('計程車', 'ji4 cheng2 che1', 'taxi')],
]);

function createServices(wordsInProfile: readonly string[] = []): TextWordFinderServices {
  return {
    profileId: 1,
    languageBundle: mandarinTraditionalBundle,
    dictionaryLookup: {
      findKnownWords: async (candidates) =>
        new Set([...candidates].filter((candidate) => DICTIONARY.has(candidate))),
      lookUp: async (headword) => {
        const entry = DICTIONARY.get(headword);
        return entry ? [entry] : [];
      },
    },
    wordRepository: {
      findWord: async (_profileId, headword) =>
        wordsInProfile.includes(headword) ? makeWord(7, { headword }) : null,
    },
  };
}

describe('findWordsInText', () => {
  it('finds the words in order, with their entries', async () => {
    const search = await findWordsInText(createServices(), '牛肉麵很好吃！');
    expect(search.words.map((word) => word.entry.headword)).toEqual(['牛肉麵', '好吃']);
    expect(search.unknownCharacters).toEqual(['很']);
    expect(search.wasShortened).toBe(false);
  });

  it('marks words the profile already has', async () => {
    const search = await findWordsInText(createServices(['好吃']), '牛肉麵很好吃');
    expect(search.words.map((word) => word.isInProfile)).toEqual([false, true]);
  });

  it('converts Simplified text to Taiwan Traditional first, phrase by phrase', async () => {
    const search = await findWordsInText(createServices(), '出租车');
    expect(search.words.map((word) => word.entry.headword)).toEqual(['計程車']);
  });

  it('searches only the start of very long text', async () => {
    const longText = `${'很'.repeat(MAX_SEARCHED_TEXT_LENGTH)}好吃`;
    const search = await findWordsInText(createServices(), longText);
    expect(search.words).toEqual([]);
    expect(search.wasShortened).toBe(true);
  });
});

describe('foundWordsToImportRows', () => {
  it('keeps each reading and the time added, leaving meanings to the dictionary', () => {
    const entry = entryFor('牛肉', 'niu2 rou4', 'beef');
    expect(foundWordsToImportRows([entry], 1234)).toEqual({
      rows: [
        { rowNumber: 1, headword: '牛肉', meanings: [], reading: 'niu2 rou4', addedAtMs: 1234 },
      ],
      invalidRowNumbers: [],
    });
  });
});
