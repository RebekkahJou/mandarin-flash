import {
  MAX_FOUND_WORD_LENGTH,
  scriptRuns,
  splitIntoKnownWords,
  wordCandidates,
} from '../textWordSplitting';

const isHan = (character: string) => /\p{Script=Han}/u.test(character);

describe('scriptRuns', () => {
  it('breaks the text at anything outside the script', () => {
    expect(scriptRuns('牛肉麵 NT$120，滷肉飯！', isHan)).toEqual([
      ['牛', '肉', '麵'],
      ['滷', '肉', '飯'],
    ]);
  });

  it('keeps characters outside the Basic Multilingual Plane whole', () => {
    expect(scriptRuns('𠮷野家', isHan)).toEqual([['𠮷', '野', '家']]);
  });

  it('finds no runs in text without the script', () => {
    expect(scriptRuns('hello 123', isHan)).toEqual([]);
  });
});

describe('wordCandidates', () => {
  it('lists every substring of each run', () => {
    expect([...wordCandidates([['牛', '肉', '麵']])].sort()).toEqual(
      ['牛', '牛肉', '牛肉麵', '肉', '肉麵', '麵'].sort(),
    );
  });

  it('stops at the longest word length', () => {
    const longRun = Array.from('一二三四五六七八九十');
    const lengths = [...wordCandidates([longRun])].map((candidate) => candidate.length);
    expect(Math.max(...lengths)).toBe(MAX_FOUND_WORD_LENGTH);
  });
});

describe('splitIntoKnownWords', () => {
  const known = new Set(['牛肉', '牛肉麵', '麵', '好', '吃', '好吃', '我', '要', '一', '碗']);

  it('takes the longest known word at each position', () => {
    const runs = scriptRuns('我要一碗牛肉麵，好吃！', isHan);
    expect(splitIntoKnownWords(runs, known)).toEqual({
      words: ['我', '要', '一', '碗', '牛肉麵', '好吃'],
      unknownCharacters: [],
    });
  });

  it('lists each word once, in first appearance order', () => {
    const runs = scriptRuns('好吃。我要好吃', isHan);
    expect(splitIntoKnownWords(runs, known).words).toEqual(['好吃', '我', '要']);
  });

  it('skips characters that start no known word and reports them', () => {
    const runs = scriptRuns('滷牛肉', isHan);
    expect(splitIntoKnownWords(runs, known)).toEqual({
      words: ['牛肉'],
      unknownCharacters: ['滷'],
    });
  });
});
