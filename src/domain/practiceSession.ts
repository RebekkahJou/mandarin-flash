import type { RandomSource } from './random';
import { randomIntegerInclusive } from './random';

/** A missed card comes back after this many other cards (bounded by queue length). */
export const MISSED_CARD_MIN_GAP = 3;
export const MISSED_CARD_MAX_GAP = 5;

export interface CardAnswerResult {
  /** True only on the answer that first completes the whole deck. */
  hasJustCompletedDeck: boolean;
  isAllLearned: boolean;
}

/** Everything a paused practice set needs to carry on later. */
export interface PracticeSessionSnapshot {
  /** Every word in the set. */
  wordIds: number[];
  /** Cards still to answer, the current one first. */
  queue: number[];
  completedWordIds: number[];
  learnedWordIds: number[];
  /** Word id and how many times it was missed. */
  missedCounts: [number, number][];
}

/**
 * Card order for one practice set. Cards are identified by word id.
 * missed → back in a few cards; gotten → end of queue; learned → removed.
 */
export class PracticeSession {
  private queue: number[];
  private readonly wordIds: readonly number[];
  private readonly completedWordIds = new Set<number>();
  private readonly learnedWordIds = new Set<number>();
  private readonly missedCounts = new Map<number, number>();
  private readonly random: RandomSource;

  constructor(wordIds: readonly number[], random: RandomSource = Math.random) {
    this.queue = [...new Set(wordIds)];
    this.wordIds = [...this.queue];
    this.random = random;
  }

  /** Picks a paused set up again, leaving out words that no longer exist (deleted meanwhile). */
  static fromSnapshot(
    snapshot: PracticeSessionSnapshot,
    existingWordIds: ReadonlySet<number>,
    random: RandomSource = Math.random,
  ): PracticeSession {
    const exists = (wordId: number) => existingWordIds.has(wordId);
    const session = new PracticeSession(snapshot.wordIds.filter(exists), random);
    session.queue = snapshot.queue.filter(exists);
    snapshot.completedWordIds.filter(exists).forEach((id) => session.completedWordIds.add(id));
    snapshot.learnedWordIds.filter(exists).forEach((id) => session.learnedWordIds.add(id));
    for (const [wordId, count] of snapshot.missedCounts) {
      if (exists(wordId)) session.missedCounts.set(wordId, count);
    }
    return session;
  }

  toSnapshot(): PracticeSessionSnapshot {
    return {
      wordIds: [...this.wordIds],
      queue: [...this.queue],
      completedWordIds: [...this.completedWordIds],
      learnedWordIds: [...this.learnedWordIds],
      missedCounts: [...this.missedCounts],
    };
  }

  get currentWordId(): number | undefined {
    return this.queue[0];
  }

  get remainingCardCount(): number {
    return this.queue.length;
  }

  get completedCardCount(): number {
    return this.completedWordIds.size;
  }

  get cardCount(): number {
    return this.wordIds.length;
  }

  get learnedWordIdList(): number[] {
    return [...this.learnedWordIds];
  }

  get isDeckCompleted(): boolean {
    return this.wordIds.length > 0 && this.completedWordIds.size === this.wordIds.length;
  }

  get isAllLearned(): boolean {
    return this.wordIds.length > 0 && this.queue.length === 0;
  }

  missCountFor(wordId: number): number {
    return this.missedCounts.get(wordId) ?? 0;
  }

  markMissed(): CardAnswerResult {
    const wordId = this.takeCurrentCard();
    this.missedCounts.set(wordId, this.missCountFor(wordId) + 1);
    const gap = randomIntegerInclusive(MISSED_CARD_MIN_GAP, MISSED_CARD_MAX_GAP, this.random);
    const insertIndex = Math.min(gap, this.queue.length);
    this.queue.splice(insertIndex, 0, wordId);
    return this.answerResult(false);
  }

  markGotten(): CardAnswerResult {
    const wordId = this.takeCurrentCard();
    this.queue.push(wordId);
    return this.completeCard(wordId);
  }

  markLearned(): CardAnswerResult {
    const wordId = this.takeCurrentCard();
    this.learnedWordIds.add(wordId);
    return this.completeCard(wordId);
  }

  private takeCurrentCard(): number {
    const wordId = this.queue.shift();
    if (wordId === undefined) {
      throw new Error('No card left to answer in this practice session.');
    }
    return wordId;
  }

  private completeCard(wordId: number): CardAnswerResult {
    const wasDeckCompleted = this.isDeckCompleted;
    this.completedWordIds.add(wordId);
    return this.answerResult(!wasDeckCompleted && this.isDeckCompleted);
  }

  private answerResult(hasJustCompletedDeck: boolean): CardAnswerResult {
    return { hasJustCompletedDeck, isAllLearned: this.isAllLearned };
  }
}
