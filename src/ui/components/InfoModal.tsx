import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

interface InfoModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
  /** Tapping outside or pressing Back; defaults to onClose. Set it when closing has a side effect. */
  onDismiss?: () => void;
}

/** A centered card over a dimmed background; tapping outside closes it. */
export function InfoModal({
  isVisible,
  onClose,
  children,
  closeLabel = 'Close',
  onDismiss = onClose,
}: InfoModalProps) {
  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss} accessibilityLabel="Close">
        <Pressable style={styles.card} onPress={() => undefined}>
          {children}
          <View style={styles.footer}>
            <PrimaryButton label={closeLabel} onPress={onClose} isOutlined />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.large,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    padding: spacing.large,
    gap: spacing.medium,
    maxHeight: '85%',
  },
  footer: {
    flexDirection: 'row',
  },
});
