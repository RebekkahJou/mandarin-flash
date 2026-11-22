import { PracticeSession } from '../practiceSession';

const alwaysLowest = () => 0;
const alwaysHighest = () => 0.9999;

/** Walks the queue by marking cards gotten, returning the order they appeared in. */
function nextWordIds(session: PracticeSession, count: number): number[] {
  const seenWordIds: number[] = [];
  for (let index = 0; index < count; index++) {
    const wordId = session.currentWordId;
    if (wordId === undefined) break;
    seenWordIds.push(wordId);
    session.markGotten();
  }
  return seenWordIds;
}

describe('PracticeSession', () => {
  it('ignores duplicate word ids so a card never appears twice', () => {
    expect(new PracticeSession([1, 2, 2, 3]).cardCount).toBe(3);
  });

  it('puts a missed card back 3 cards later at the soonest', () => {
    const session = new PracticeSession([1, 2, 3, 4, 5, 6], alwaysLowest);
    session.markMissed();
    expect(nextWordIds(session, 4)).toEqual([2, 3, 4, 1]);
  });

  it('puts a missed card back at most 5 cards later', () => {
    const session = new PracticeSession([1, 2, 3, 4, 5, 6, 7, 8], alwaysHighest);
    session.markMissed();
    expect(nextWordIds(session, 6)).toEqual([2, 3, 4, 5, 6, 1]);
  });

  it('puts a missed card at the end when fewer cards remain than the gap', () => {
    const session = new PracticeSession([1, 2], alwaysHighest);
    session.markMissed();
    expect(session.currentWordId).toBe(2);
    expect(session.missCountFor(1)).toBe(1);
  });

  it('sends a gotten card to the end', () => {
    const session = new PracticeSession([1, 2, 3]);
    session.markGotten();
    expect(nextWordIds(session, 3)).toEqual([2, 3, 1]);
  });

  it('removes a learned card and records it', () => {
    const session = new PracticeSession([1, 2]);
    session.markLearned();
    expect(session.remainingCardCount).toBe(1);
    expect(session.learnedWordIdList).toEqual([1]);
  });

  it('reports deck completion exactly once, when every card is gotten or learned', () => {
    const session = new PracticeSession([1, 2]);
    expect(session.markGotten().hasJustCompletedDeck).toBe(false);
    expect(session.markLearned().hasJustCompletedDeck).toBe(true);
    expect(session.isDeckCompleted).toBe(true);
    expect(session.markGotten().hasJustCompletedDeck).toBe(false);
  });

  it('does not count a missed card as completed', () => {
    const session = new PracticeSession([1], alwaysLowest);
    session.markMissed();
    expect(session.isDeckCompleted).toBe(false);
    expect(session.markGotten().hasJustCompletedDeck).toBe(true);
  });

  it('carries on from a snapshot with the same order, progress and misses', () => {
    const session = new PracticeSession([1, 2, 3, 4], () => 0);
    session.markGotten();
    session.markMissed();
    session.markLearned();
    const resumed = PracticeSession.fromSnapshot(session.toSnapshot(), new Set([1, 2, 3, 4]));
    expect(resumed.toSnapshot()).toEqual(session.toSnapshot());
    expect(resumed.completedCardCount).toBe(2);
    expect(resumed.missCountFor(2)).toBe(1);
    expect(resumed.cardCount).toBe(4);
  });

  it('leaves out words deleted while the set was paused', () => {
    const session = new PracticeSession([1, 2, 3], () => 0);
    session.markGotten();
    const resumed = PracticeSession.fromSnapshot(session.toSnapshot(), new Set([2, 3]));
    expect(resumed.cardCount).toBe(2);
    expect(resumed.completedCardCount).toBe(0);
    expect(resumed.currentWordId).toBe(2);
  });

  it('ends when all words are learned', () => {
    const session = new PracticeSession([1, 2]);
    session.markLearned();
    expect(session.markLearned().isAllLearned).toBe(true);
    expect(session.currentWordId).toBeUndefined();
  });

  it('throws when answering with no cards left', () => {
    expect(() => new PracticeSession([]).markGotten()).toThrow();
  });
});
