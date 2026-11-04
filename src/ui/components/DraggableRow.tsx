import type { AccessibilityActionEvent, LayoutChangeEvent } from 'react-native';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { usePanGesture } from '../hooks/usePanGesture';
import { colors, fontSizes, radii, spacing } from '../theme';

const HANDLE_TOUCH_SIZE = 44;
const DRAGGING_ELEVATION = 6;
const MOVE_UP_ACTION = 'moveUp';
const MOVE_DOWN_ACTION = 'moveDown';
const ACCESSIBILITY_ACTIONS = [
  { name: MOVE_UP_ACTION, label: 'Move up' },
  { name: MOVE_DOWN_ACTION, label: 'Move down' },
];

export interface DragCallbacks {
  onDragStart: () => void;
  onDragMove: (dragDistance: number) => void;
  onDragEnd: () => void;
}

interface DraggableRowProps extends DragCallbacks {
  name: string;
  isDragging: boolean;
  translateY: Animated.Value;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/** A list name with a ☰ handle to drag it; screen readers get Move up / Move down actions. */
export function DraggableRow({
  name,
  isDragging,
  translateY,
  onMoveUp,
  onMoveDown,
  onLayout,
  ...dragCallbacks
}: DraggableRowProps) {
  const handleProps = usePanGesture({
    claimsTouchStart: true,
    shouldClaimMove: () => true,
    onStart: dragCallbacks.onDragStart,
    onMove: (gesture) => dragCallbacks.onDragMove(gesture.dy),
    onEnd: dragCallbacks.onDragEnd,
  });
  const rowStyle = isDragging
    ? [styles.row, styles.draggingRow, { transform: [{ translateY }] }]
    : styles.row;
  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === MOVE_UP_ACTION) onMoveUp();
    if (event.nativeEvent.actionName === MOVE_DOWN_ACTION) onMoveDown();
  };
  return (
    <Animated.View
      style={rowStyle}
      onLayout={onLayout}
      accessible
      accessibilityLabel={name}
      accessibilityHint="Drag the handle to reorder"
      accessibilityActions={ACCESSIBILITY_ACTIONS}
      onAccessibilityAction={onAccessibilityAction}
    >
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.handle} {...handleProps}>
        <Text style={styles.handleIcon}>☰</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    paddingLeft: spacing.medium,
    paddingVertical: spacing.extraSmall,
  },
  draggingRow: {
    borderColor: colors.primary,
    borderWidth: 2,
    elevation: DRAGGING_ELEVATION,
    zIndex: 1,
  },
  name: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  handle: {
    width: HANDLE_TOUCH_SIZE,
    height: HANDLE_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleIcon: {
    fontSize: fontSizes.title,
    color: colors.primary,
  },
});
