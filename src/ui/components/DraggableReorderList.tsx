import { useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';

import { dragTargetIndex, moveItemTo } from '../../domain/listOrder';
import { spacing } from '../theme';
import { DraggableRow } from './DraggableRow';

const ROW_GAP = spacing.small;

export interface ReorderableItem {
  id: number;
  name: string;
}

interface DragState {
  fromIndex: number;
  targetIndex: number;
}

interface DraggableReorderListProps {
  items: readonly ReorderableItem[];
  onReorder: (orderedIds: number[]) => void;
  /** Lets the screen stop scrolling while a row is being dragged. */
  onDragStateChange: (isDragging: boolean) => void;
}

/** Rows that can be dragged into a new order by their ☰ handle. */
export function DraggableReorderList({
  items,
  onReorder,
  onDragStateChange,
}: DraggableReorderListProps) {
  const [displayItems, setDisplayItems] = useState(items);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [translateY] = useState(() => new Animated.Value(0));
  const dragStateRef = useRef<DragState | null>(null);
  const rowPitchRef = useRef(0);

  // Only a real change of lists resets the order, so a dropped row doesn't jump back while
  // the new order is being saved.
  const itemsKey = items.map((item) => `${item.id}:${item.name}`).join('|');
  const [syncedItemsKey, setSyncedItemsKey] = useState(itemsKey);
  if (itemsKey !== syncedItemsKey) {
    setSyncedItemsKey(itemsKey);
    setDisplayItems(items);
  }

  const updateDragState = (next: DragState | null) => {
    dragStateRef.current = next;
    setDragState(next);
  };

  const commitMove = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = moveItemTo(displayItems, fromIndex, toIndex);
    setDisplayItems(reordered);
    onReorder(reordered.map((item) => item.id));
  };

  const startDrag = (index: number) => {
    translateY.setValue(0);
    updateDragState({ fromIndex: index, targetIndex: index });
    onDragStateChange(true);
  };

  /** The dragged row is drawn in its target slot, offset so it stays under the finger. */
  const moveDrag = (dragDistance: number) => {
    const current = dragStateRef.current;
    if (!current) return;
    const pitch = rowPitchRef.current;
    const targetIndex = dragTargetIndex(
      current.fromIndex,
      dragDistance,
      pitch,
      displayItems.length,
    );
    translateY.setValue(dragDistance - (targetIndex - current.fromIndex) * pitch);
    if (targetIndex !== current.targetIndex) updateDragState({ ...current, targetIndex });
  };

  const endDrag = () => {
    const finished = dragStateRef.current;
    updateDragState(null);
    translateY.setValue(0);
    onDragStateChange(false);
    if (finished) commitMove(finished.fromIndex, finished.targetIndex);
  };

  const measureRow = (event: LayoutChangeEvent) => {
    rowPitchRef.current = event.nativeEvent.layout.height + ROW_GAP;
  };

  const shownItems = dragState
    ? moveItemTo(displayItems, dragState.fromIndex, dragState.targetIndex)
    : displayItems;
  const draggedId = dragState ? displayItems[dragState.fromIndex]?.id : undefined;
  const rows = shownItems.map((item, index) => {
    const isDragging = item.id === draggedId;
    const isFirstRow = index === 0;
    const onLayout = isFirstRow ? measureRow : undefined;
    return (
      <DraggableRow
        key={item.id}
        name={item.name}
        isDragging={isDragging}
        translateY={translateY}
        onLayout={onLayout}
        onDragStart={() => startDrag(index)}
        onDragMove={moveDrag}
        onDragEnd={endDrag}
        onMoveUp={() => commitMove(index, index - 1)}
        onMoveDown={() => commitMove(index, index + 1)}
      />
    );
  });

  return <View style={styles.list}>{rows}</View>;
}

const styles = StyleSheet.create({
  list: {
    gap: ROW_GAP,
  },
});
