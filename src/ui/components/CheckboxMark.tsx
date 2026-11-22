import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme';

interface CheckboxMarkProps {
  isChecked: boolean;
  /** Greyed out, e.g. a word set the profile already added. */
  isDisabled?: boolean;
}

/** The square box of a checkbox, ticked when checked. The caller makes it pressable. */
export function CheckboxMark({ isChecked, isDisabled = false }: CheckboxMarkProps) {
  const boxStyle = [styles.box, isChecked && styles.checkedBox, isDisabled && styles.disabledBox];
  const checkmarkStyle = [styles.checkmark, isDisabled && styles.disabledCheckmark];
  const checkmark = isChecked ? <Text style={checkmarkStyle}>✓</Text> : null;
  return <View style={boxStyle}>{checkmark}</View>;
}

const CHECKBOX_SIZE = 24;

const styles = StyleSheet.create({
  box: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: radii.small,
    borderWidth: 2,
    borderColor: colors.controlBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  disabledBox: {
    borderColor: colors.disabled,
    backgroundColor: colors.disabled,
  },
  checkmark: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  disabledCheckmark: {
    color: colors.textSecondary,
  },
});
