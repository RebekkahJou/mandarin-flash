/** "1 word", "2 words". */
export function formatWordCount(count: number): string {
  return `${count} ${count === 1 ? 'word' : 'words'}`;
}
