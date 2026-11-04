/** Shared design tokens. Components use these instead of hard-coded colors or sizes. */
const palette = {
  orange: '#EC6A37',
  darkOrange: '#B8431A',
  cream: '#FFF9EC',
  deepCream: '#EADFC9',
  stone: '#D9D2C3',
  cerulean: '#247BA0',
  deepCerulean: '#1B5E7A',
  taupeGrey: '#7C6367',
  // Smoky rose and deep teal are nearly indistinguishable with protanopia and achromatopsia.
  // Don't use them as a pair the user must tell apart. See CLAUDE.md.
  smokyRose: '#825E64',
  teal: '#52796F',
  deepTeal: '#3F5F57',
  nearBlack: '#1C1C1C',
  softBlack: '#5C5852',
  white: '#FFFFFF',
  amber: '#8A5A00',
  paleAmber: '#FDF0D5',
} as const;

/**
 * Text pairings meet WCAG AA (4.5:1). Cerulean marks everything tappable. Orange is never
 * behind text, because no text color is easy to read on it: it is only for highlights,
 * decorations and icons, and accentStrong is used where orange appears as text or a thin line.
 */
export const colors = {
  background: palette.cream,
  surface: palette.white,
  textPrimary: palette.nearBlack,
  textSecondary: palette.softBlack,
  border: palette.deepCream,
  primary: palette.cerulean,
  onPrimary: palette.white,
  accent: palette.orange,
  accentStrong: palette.darkOrange,
  phonetic: palette.cerulean,
  missed: palette.smokyRose,
  gotten: palette.teal,
  learned: palette.deepCerulean,
  /** Marks rows that work differently from their neighbours, such as All words. */
  feature: palette.deepTeal,
  onFeature: palette.white,
  disabled: palette.stone,
  warning: palette.amber,
  warningSurface: palette.paleAmber,
  overlay: 'rgba(28, 28, 28, 0.45)',
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
  /** Fully rounded ends, whatever the height. */
  pill: 999,
} as const;

/** English text never rotates fonts; the platform sans-serif is used throughout. */
export const ENGLISH_FONT_FAMILY = 'sans-serif';
