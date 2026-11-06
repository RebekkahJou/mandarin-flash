import { GeneralWordList } from '../generalWordList';
import { PartOfSpeech } from '../partOfSpeech';
import { PartOfSpeechWordList } from '../partOfSpeechWordList';
import {
  allMeaningsOf,
  definitionsForEntry,
  definitionsOverrideFor,
  haveSameMeanings,
} from '../wordList';
import { makeWord } from './testWords';

const RELIABLE = [PartOfSpeech.Noun, PartOfSpeech.Verb, PartOfSpeech.Adjective];

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
    const word = makeWord(10, { headword: '行' });
    list.addWord({ entryId: 1, word });
    list.addWord({ entryId: 2, word });
    expect(list.length).toBe(2);
    expect(list.containsHeadword('行')).toBe(true);
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
    expect(list.validateWord([PartOfSpeech.Noun], RELIABLE)).toBeNull();
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
    expect(verbList.validateWord([PartOfSpeech.Noun], RELIABLE)?.listName).toBe('Verbs');
    expect(verbList.validateWord([PartOfSpeech.Noun, PartOfSpeech.Verb], RELIABLE)).toBeNull();
  });

  it('does not warn about words the dictionary has no data for', () => {
    expect(verbList.validateWord([], RELIABLE)).toBeNull();
  });

  it('does not warn when the language tags its part of speech loosely', () => {
    const adverbList = new PartOfSpeechWordList({
      id: 3,
      profileId: 1,
      name: 'Adverbs',
      partOfSpeech: PartOfSpeech.Adverb,
    });
    expect(adverbList.validateWord([PartOfSpeech.Noun], RELIABLE)).toBeNull();
  });
});

describe('haveSameMeanings', () => {
  it('compares meanings in order', () => {
    expect(haveSameMeanings(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(haveSameMeanings(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(haveSameMeanings(['a'], ['a', 'b'])).toBe(false);
  });
});

describe('definitionsOverrideFor', () => {
  const word = makeWord(1, { definitions: ['thank you'] });

  it('stores nothing when the list meanings match the word or are empty', () => {
    expect(definitionsOverrideFor(word, ['thank you'])).toBeNull();
    expect(definitionsOverrideFor(word, [])).toBeNull();
  });

  it('stores the list meanings when they differ', () => {
    expect(definitionsOverrideFor(word, ['thanks'])).toEqual(['thanks']);
  });
});

describe('allMeaningsOf', () => {
  it('adds meanings that only some lists use after the word’s own meanings', () => {
    expect(
      allMeaningsOf(['car', 'vehicle', 'machine'], [['to shape with a lathe'], ['car', 'auto']]),
    ).toEqual(['car', 'vehicle', 'machine', 'to shape with a lathe', 'auto']);
  });

  it('returns the word’s own meanings when no list has its own', () => {
    expect(allMeaningsOf(['friend'], [])).toEqual(['friend']);
  });
});
