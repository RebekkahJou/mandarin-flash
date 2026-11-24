import { GamePlayer, GameWinner, winnerByScore } from '../gamePlayers';
import {
  MEANING_MATCH_OPTION_COUNT,
  MEANING_MATCH_PICK_LIST_SIZE,
  addMeaningMatchAnswer,
  canPlayMeaningMatch,
  meaningMatchOptions,
  meaningMatchPickList,
  meaningMatchTurn,
  meaningMatchWinner,
  parseMeaningMatchRoundCount,
} from '../meaningMatch';
import type { SharedWordPair } from '../sharedWords';
import { makeWord, seededRandom } from './testWords';

function makePairs(count: number): SharedWordPair[] {
  return Array.from({ length: count }, (_, index) => ({
    first: makeWord(index + 1),
    second: makeWord(index + 101),
  }));
}

describe('meaningMatchTurn', () => {
  it('has profile 1 pick first, then swaps roles every turn', () => {
    expect(meaningMatchTurn(0)).toMatchObject({
      picker: GamePlayer.First,
      answerer: GamePlayer.Second,
    });
    expect(meaningMatchTurn(1)).toMatchObject({
      picker: GamePlayer.Second,
      answerer: GamePlayer.First,
    });
  });
});

describe('meaningMatchPickList', () => {
  it('offers up to 20 shared words', () => {
    expect(meaningMatchPickList(makePairs(30), seededRandom(1))).toHaveLength(
      MEANING_MATCH_PICK_LIST_SIZE,
    );
    expect(meaningMatchPickList(makePairs(6), seededRandom(1))).toHaveLength(6);
  });
});

describe('meaningMatchOptions', () => {
  it('gives 4 of the answerer’s words with the right one among them', () => {
    const pairs = makePairs(10);
    const options = meaningMatchOptions(pairs, pairs[3], GamePlayer.Second, seededRandom(2));
    expect(options).toHaveLength(MEANING_MATCH_OPTION_COUNT);
    expect(options.map((word) => word.id)).toContain(104);
    expect(options.every((word) => word.id > 100)).toBe(true);
  });

  it('leaves out words written the same as the right one', () => {
    const pairs: SharedWordPair[] = [
      { first: makeWord(1), second: makeWord(11, { headword: '好' }) },
      { first: makeWord(2), second: makeWord(12, { headword: '好' }) },
      { first: makeWord(3), second: makeWord(13, { headword: '人' }) },
    ];
    const options = meaningMatchOptions(pairs, pairs[0], GamePlayer.Second, seededRandom(3));
    expect(options.map((word) => word.headword).sort()).toEqual(['人', '好']);
  });
});

describe('scores', () => {
  it('counts correct answers per answerer and the higher score wins', () => {
    let scores = { firstPlayerCorrect: 0, secondPlayerCorrect: 0 };
    scores = addMeaningMatchAnswer(scores, GamePlayer.Second, true);
    scores = addMeaningMatchAnswer(scores, GamePlayer.First, false);
    expect(scores).toEqual({ firstPlayerCorrect: 0, secondPlayerCorrect: 1 });
    expect(meaningMatchWinner(scores)).toBe(GameWinner.Second);
  });

  it('ties on equal scores', () => {
    expect(winnerByScore(3, 3, false)).toBe(GameWinner.Tie);
  });

  it('needs at least 4 shared words', () => {
    expect(canPlayMeaningMatch(3)).toBe(false);
    expect(canPlayMeaningMatch(4)).toBe(true);
  });
});

describe('parseMeaningMatchRoundCount', () => {
  it('reads a valid round count and falls back to 5 otherwise', () => {
    expect(parseMeaningMatchRoundCount('15')).toBe(15);
    expect(parseMeaningMatchRoundCount('7')).toBe(5);
    expect(parseMeaningMatchRoundCount(undefined)).toBe(5);
  });
});
