import { GeneralWordList } from '../generalWordList';
import { PartOfSpeech } from '../partOfSpeech';
import { PartOfSpeechWordList } from '../partOfSpeechWordList';
import { definitionsForEntry, haveSameMeanings } from '../wordList';
import { makeWord } from './testWords';

const candidates = [
  { text: 'to walk', partsOfSpeech: [PartOfSpeech.Verb] },
  { text: 'row; line', partsOfSpeech: [PartOfSpeech.Noun] },
  { text: 'capable', partsOfSpeech: [PartOfSpeech.Adjective] },
  { text: 'to be OK', partsOfSpeech: [PartOfSpeech.Verb] },
  { text: 'profession', partsOfSpeech: [PartOfSpeech.Noun] },
];

describe('WordList', () => {
  it('tracks length as words are added and removed, allowing duplicates', () => {
    const list = new GeneralWordList({ id: 1, profileId: 1, name: 'General Vocabulary' });
    const word = makeWord(10, { traditional: '行' });
    list.addWord({ entryId: 1, word });
    list.addWord({ entryId: 2, word });
    expect(list.length).toBe(2);
    expect(list.containsCharacter('行')).toBe(true);
    list.removeWord(1);
    expect(list.length).toBe(1);
  });

  it('uses a per-list definition override when present', () => {
    const word = makeWord(1, { definitions: ['original'] });
    expect(definitionsForEntry({ entryId: 1, word })).toEqual(['original']);
    expect(definitionsForEntry({ entryId: 1, word, definitionsOverride: ['custom'] })).toEqual([
      'custom',
    ]);
  });

  it('general lists pick the first 3 meanings of any kind and never warn', () => {
    const list = new GeneralWordList({ id: 1, profileId: 1, name: 'Focus Vocabulary' });
    expect(list.selectDefaultMeanings(candidates)).toEqual(['to walk', 'row; line', 'capable']);
    expect(list.validateWord([PartOfSpeech.Noun])).toBeNull();
  });
});

describe('PartOfSpeechWordList', () => {
  const verbList = new PartOfSpeechWordList({
    id: 2,
    profileId: 1,
    name: 'Verbs',
    partOfSpeech: PartOfSpeech.Verb,
  });

  it('picks the first meanings of its own part of speech', () => {
    expect(verbList.selectDefaultMeanings(candidates)).toEqual(['to walk', 'to be OK']);
  });

  it('falls back to any meanings when none match', () => {
    const nounOnly = [{ text: 'table', partsOfSpeech: [PartOfSpeech.Noun] }];
    expect(verbList.selectDefaultMeanings(nounOnly)).toEqual(['table']);
  });

  it('warns when the word has no meaning of the list part of speech', () => {
    expect(verbList.validateWord([PartOfSpeech.Noun])?.listName).toBe('Verbs');
    expect(verbList.validateWord([PartOfSpeech.Noun, PartOfSpeech.Verb])).toBeNull();
  });

  it('does not warn about words the dictionary has no data for', () => {
    expect(verbList.validateWord([])).toBeNull();
  });
});

describe('haveSameMeanings', () => {
  it('compares meanings in order', () => {
    expect(haveSameMeanings(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(haveSameMeanings(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(haveSameMeanings(['a'], ['a', 'b'])).toBe(false);
  });
});
