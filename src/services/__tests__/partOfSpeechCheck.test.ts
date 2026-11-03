import { makeWord } from '../../domain/__tests__/testWords';
import { GeneralWordList } from '../../domain/generalWordList';
import { PartOfSpeech } from '../../domain/partOfSpeech';
import { PartOfSpeechWordList } from '../../domain/partOfSpeechWordList';
import type { DictionaryEntry } from '../dictionaryLookup';
import { findPartOfSpeechMismatches } from '../partOfSpeechCheck';

const dictionary: Record<string, DictionaryEntry[]> = {
  走: [
    {
      traditional: '走',
      pinyin: 'zou3',
      definitionCandidates: [{ text: 'to walk', partsOfSpeech: [PartOfSpeech.Verb] }],
    },
  ],
  朋友: [
    {
      traditional: '朋友',
      pinyin: 'peng2 you5',
      definitionCandidates: [{ text: 'friend', partsOfSpeech: [PartOfSpeech.Noun] }],
    },
  ],
  行: [
    {
      traditional: '行',
      pinyin: 'xing2',
      definitionCandidates: [{ text: 'to walk', partsOfSpeech: [PartOfSpeech.Verb] }],
    },
    {
      traditional: '行',
      pinyin: 'hang2',
      definitionCandidates: [{ text: 'row', partsOfSpeech: [PartOfSpeech.Noun] }],
    },
  ],
};
const lookUp = async (traditional: string) => dictionary[traditional] ?? [];

const walk = makeWord(1, { traditional: '走', pinyin: 'zou3' });
const friend = makeWord(2, { traditional: '朋友', pinyin: 'peng2 you5' });
const row = makeWord(3, { traditional: '行', pinyin: 'hang2' });
const unknown = makeWord(4, { traditional: '㐀', pinyin: 'qiu1' });
const entries = [walk, friend, friend, row, unknown].map((word, index) => ({
  entryId: index + 1,
  word,
}));

describe('findPartOfSpeechMismatches', () => {
  it('flags words with no meaning of the list type, judged by their own reading', async () => {
    const verbs = new PartOfSpeechWordList({
      id: 1,
      profileId: 1,
      name: 'Verbs',
      partOfSpeech: PartOfSpeech.Verb,
      entries,
    });
    expect(await findPartOfSpeechMismatches(verbs, lookUp)).toEqual(new Set([friend.id, row.id]));
  });

  it('never flags words in general lists', async () => {
    const general = new GeneralWordList({ id: 2, profileId: 1, name: 'Phrases', entries });
    expect(await findPartOfSpeechMismatches(general, lookUp)).toEqual(new Set());
  });
});
