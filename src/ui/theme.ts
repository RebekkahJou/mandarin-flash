/** Shared design tokens. Components use these instead of hard-coded colors or sizes. */
export const colors = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  textPrimary: '#1F1B16',
  textSecondary: '#6B635A',
  border: '#E3DDD3',
  primary: '#B23A3A',
  primaryText: '#FFFFFF',
  missed: '#C2410C',
  gotten: '#15803D',
  learned: '#1D4ED8',
  disabled: '#BDB6AC',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const spacing = {
  extraSmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 32,
} as const;

export const fontSizes = {
  small: 14,
  body: 16,
  title: 20,
  tabIcon: 20,
  heading: 28,
  flashcardCharacter: 96,
  flashcardPhrase: 56,
} as const;

export const radii = {
  small: 6,
  medium: 12,
  large: 20,
} as const;

/** English text never rotates fonts; the platform sans-serif is used throughout. */
export const ENGLISH_FONT_FAMILY = 'sans-serif';
