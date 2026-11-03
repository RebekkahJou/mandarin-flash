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

/**
 * Card order for one practice set. Cards are identified by word id.
 * missed → back in a few cards; gotten → end of queue; learned → removed.
 */
export class PracticeSession {
  private queue: number[];
  private readonly totalCardCount: number;
  private readonly completedWordIds = new Set<number>();
  private readonly learnedWordIds = new Set<number>();
  private readonly missedCounts = new Map<number, number>();
  private readonly random: RandomSource;

  constructor(wordIds: readonly number[], random: RandomSource = Math.random) {
    this.queue = [...new Set(wordIds)];
    this.totalCardCount = this.queue.length;
    this.random = random;
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
    return this.totalCardCount;
  }

  get learnedWordIdList(): number[] {
    return [...this.learnedWordIds];
  }

  get isDeckCompleted(): boolean {
    return this.totalCardCount > 0 && this.completedWordIds.size === this.totalCardCount;
  }

  get isAllLearned(): boolean {
    return this.totalCardCount > 0 && this.queue.length === 0;
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
