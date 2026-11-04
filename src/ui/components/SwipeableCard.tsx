import type { ReactNode } from 'react';
import { useState } from 'react';
import type { PanResponderGestureState } from 'react-native';
import { Animated, StyleSheet } from 'react-native';

import type { SwipeAnswer } from '../../domain/practiceSwipe';
import { swipeAnswerFor } from '../../domain/practiceSwipe';
import { usePanGesture } from '../hooks/usePanGesture';

/** Movement (in dp) before a touch counts as a swipe, so taps still reach the card. */
const SWIPE_START_DISTANCE = 10;

interface SwipeableCardProps {
  children: ReactNode;
  onSwipe: (answer: SwipeAnswer) => void;
}

function isSwipeMovement(gesture: PanResponderGestureState): boolean {
  return Math.abs(gesture.dx) > SWIPE_START_DISTANCE || Math.abs(gesture.dy) > SWIPE_START_DISTANCE;
}

/** Follows the finger; a long enough swipe answers the card, anything shorter springs back. */
export function SwipeableCard({ children, onSwipe }: SwipeableCardProps) {
  const [position] = useState(() => new Animated.ValueXY());

  const springBack = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
  };

  const endSwipe = (gesture: PanResponderGestureState, isCancelled: boolean) => {
    const answer = isCancelled ? null : swipeAnswerFor(gesture.dx, gesture.dy);
    if (!answer) {
      springBack();
      return;
    }
    // The next card replaces this one, so it starts centred rather than flying back in.
    position.setValue({ x: 0, y: 0 });
    onSwipe(answer);
  };

  const panHandlers = usePanGesture({
    shouldClaimMove: isSwipeMovement,
    onMove: (gesture) => position.setValue({ x: gesture.dx, y: gesture.dy }),
    onEnd: endSwipe,
  });

  const cardStyle = [styles.card, { transform: position.getTranslateTransform() }];
  return (
    <Animated.View style={cardStyle} {...panHandlers}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
});
