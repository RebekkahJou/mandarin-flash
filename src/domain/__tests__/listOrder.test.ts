import { dragTargetIndex, moveItemTo } from '../listOrder';

describe('moveItemTo', () => {
  const items = ['a', 'b', 'c', 'd'];

  it('moves an item down or up, shifting the others', () => {
    expect(moveItemTo(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItemTo(items, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('leaves the order unchanged for out-of-range indexes', () => {
    expect(moveItemTo(items, -1, 2)).toEqual(items);
    expect(moveItemTo(items, 1, 4)).toEqual(items);
  });

  it('does not change the original', () => {
    moveItemTo(items, 0, 3);
    expect(items).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('dragTargetIndex', () => {
  const rowPitch = 60;

  it('moves one place per row height, rounding to the nearest row', () => {
    expect(dragTargetIndex(1, 25, rowPitch, 5)).toBe(1);
    expect(dragTargetIndex(1, 35, rowPitch, 5)).toBe(2);
    expect(dragTargetIndex(3, -130, rowPitch, 5)).toBe(1);
  });

  it('stays within the list', () => {
    expect(dragTargetIndex(1, -500, rowPitch, 5)).toBe(0);
    expect(dragTargetIndex(1, 500, rowPitch, 5)).toBe(4);
  });

  it('stays put before the row height is known', () => {
    expect(dragTargetIndex(2, 300, 0, 5)).toBe(2);
  });
});
