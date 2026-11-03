/** Returns a number in [0, 1). Injected so randomized logic is testable. */
export type RandomSource = () => number;

export function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function randomIntegerInclusive(min: number, max: number, random: RandomSource): number {
  return min + Math.floor(random() * (max - min + 1));
}
