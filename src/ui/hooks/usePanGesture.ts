import { useEffect, useRef, useState } from 'react';
import type { PanResponderGestureState } from 'react-native';
import { PanResponder } from 'react-native';

export interface PanGestureHandlers {
  /** Take the touch as soon as it starts (drag handles); otherwise only once shouldClaimMove agrees. */
  claimsTouchStart?: boolean;
  shouldClaimMove: (gesture: PanResponderGestureState) => boolean;
  onStart?: () => void;
  onMove: (gesture: PanResponderGestureState) => void;
  /** isCancelled is true when the system took the touch away, e.g. for a back gesture. */
  onEnd: (gesture: PanResponderGestureState, isCancelled: boolean) => void;
}

/** Touch handlers for a drag or swipe. Keeps the gesture alive across re-renders. */
export function usePanGesture(handlers: PanGestureHandlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });
  // The ref is only read inside touch handlers, never during render. Recreating the responder
  // on each render instead would reset the gesture partway through.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => handlersRef.current.claimsTouchStart ?? false,
      onMoveShouldSetPanResponderCapture: (_event, gesture) =>
        handlersRef.current.shouldClaimMove(gesture),
      // Keeps the page from scrolling away mid-gesture.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => handlersRef.current.onStart?.(),
      onPanResponderMove: (_event, gesture) => handlersRef.current.onMove(gesture),
      onPanResponderRelease: (_event, gesture) => handlersRef.current.onEnd(gesture, false),
      onPanResponderTerminate: (_event, gesture) => handlersRef.current.onEnd(gesture, true),
    }),
  );
  return panResponder.panHandlers;
}
