import { GameWinner } from '../gamePlayers';
import type { SharedWordPair } from '../sharedWords';
import { canPlaySpeedRace, planSpeedRaceRounds, speedRaceOutcome } from '../speedRace';
import { makeWord, seededRandom } from './testWords';

function makePairs(count: number): SharedWordPair[] {
  return Array.from({ length: count }, (_, index) => ({
    first: makeWord(index + 1),
    second: makeWord(index + 101),
  }));
}

function firstIds(round: readonly SharedWordPair[]): number[] {
  return round.map((pair) => pair.first.id);
}

describe('planSpeedRaceRounds', () => {
  it('draws distinct words per round without repeats while enough remain', () => {
    const rounds = planSpeedRaceRounds(
      makePairs(50),
      { wordCount: 20, roundCount: 2 },
      seededRandom(1),
    );
    const allIds = rounds.flatMap(firstIds);
    expect(rounds.map((round) => round.length)).toEqual([20, 20]);
    expect(new Set(allIds).size).toBe(40);
  });

  it('starts over once every word has had a turn, still without repeats in a round', () => {
    const rounds = planSpeedRaceRounds(
      makePairs(30),
      { wordCount: 20, roundCount: 3 },
      seededRandom(2),
    );
    for (const round of rounds) {
      expect(new Set(firstIds(round)).size).toBe(20);
    }
    const firstTwoRounds = new Set([...firstIds(rounds[0]), ...firstIds(rounds[1])]);
    expect(firstTwoRounds.size).toBe(30);
  });

  it('makes smaller sets when there are fewer shared words than the set size', () => {
    const rounds = planSpeedRaceRounds(
      makePairs(12),
      { wordCount: 20, roundCount: 1 },
      seededRandom(3),
    );
    expect(rounds[0]).toHaveLength(12);
  });
});

describe('speedRaceOutcome', () => {
  it('adds up each player’s times and the lower total wins', () => {
    const outcome = speedRaceOutcome([
      { firstPlayerMs: 60_000, secondPlayerMs: 50_000 },
      { firstPlayerMs: 40_000, secondPlayerMs: 55_000 },
    ]);
    expect(outcome).toEqual({
      firstPlayerTotalMs: 100_000,
      secondPlayerTotalMs: 105_000,
      winner: GameWinner.First,
    });
  });
});

describe('canPlaySpeedRace', () => {
  it('needs at least 10 shared words', () => {
    expect(canPlaySpeedRace(9)).toBe(false);
    expect(canPlaySpeedRace(10)).toBe(true);
  });
});
