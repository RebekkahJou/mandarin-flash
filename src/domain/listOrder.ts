/** A copy with the item at `fromIndex` moved to `toIndex`; unchanged if either is out of range. */
export function moveItemTo<Item>(
  items: readonly Item[],
  fromIndex: number,
  toIndex: number,
): Item[] {
  const reordered = [...items];
  const isInRange = (index: number) => index >= 0 && index < items.length;
  if (!isInRange(fromIndex) || !isInRange(toIndex)) return reordered;
  const [movedItem] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, movedItem);
  return reordered;
}

/**
 * Where a dragged row lands: one place per row height dragged, rounded to the nearest row and
 * kept within the list.
 */
export function dragTargetIndex(
  fromIndex: number,
  dragDistance: number,
  rowPitch: number,
  itemCount: number,
): number {
  if (rowPitch <= 0 || itemCount === 0) return fromIndex;
  const unclampedIndex = fromIndex + Math.round(dragDistance / rowPitch);
  return Math.min(Math.max(unclampedIndex, 0), itemCount - 1);
}
