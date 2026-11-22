import { LanguageId } from '../../domain/language';
import { makeWord } from '../../domain/__tests__/testWords';
import type { Word } from '../../domain/word';
import { loadSharedWords } from '../sharedWordsLoader';

const TRADITIONAL_PROFILE = { id: 1, languageId: LanguageId.MandarinTraditional };
const SIMPLIFIED_PROFILE = { id: 2, languageId: LanguageId.MandarinSimplified };

function repositoryWith(wordsByProfile: Record<number, Word[]>) {
  return { listGameWords: async (profileId: number) => wordsByProfile[profileId] ?? [] };
}

describe('loadSharedWords', () => {
  it('matches Traditional and Simplified profiles by characters, whatever the reading', async () => {
    const repository = repositoryWith({
      1: [
        makeWord(1, { headword: '老師', reading: 'lao3 shi1' }),
        makeWord(2, { headword: '垃圾', reading: 'le4 se4' }),
        makeWord(3, { headword: '電腦' }),
      ],
      2: [
        makeWord(11, { headword: '老师', reading: 'lao3 shi1' }),
        makeWord(12, { headword: '垃圾', reading: 'la1 ji1' }),
      ],
    });
    const pairs = await loadSharedWords(TRADITIONAL_PROFILE, SIMPLIFIED_PROFILE, repository);
    expect(pairs.map(({ first, second }) => [first.headword, second.headword])).toEqual([
      ['老師', '老师'],
      ['垃圾', '垃圾'],
    ]);
  });
});
