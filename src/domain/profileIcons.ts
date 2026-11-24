/**
 * Icons a profile can show with its name in screen headers. Emoji, so they come from the phone's
 * own color emoji font and add nothing to the app's size. Each differs in shape, not just color.
 */
export interface ProfileIcon {
  icon: string;
  /** Read aloud by screen readers. */
  name: string;
}

export const PROFILE_ICONS: readonly ProfileIcon[] = [
  { icon: '🐼', name: 'panda' },
  { icon: '🦊', name: 'fox' },
  { icon: '🐯', name: 'tiger' },
  { icon: '🐸', name: 'frog' },
  { icon: '🐙', name: 'octopus' },
  { icon: '🦋', name: 'butterfly' },
  { icon: '🐢', name: 'turtle' },
  { icon: '🦄', name: 'unicorn' },
  { icon: '🌸', name: 'blossom' },
  { icon: '🌻', name: 'sunflower' },
  { icon: '🍎', name: 'apple' },
  { icon: '🍉', name: 'watermelon' },
  { icon: '⭐', name: 'star' },
  { icon: '🌈', name: 'rainbow' },
  { icon: '🚀', name: 'rocket' },
  { icon: '⚽', name: 'ball' },
];

/** Stored values that aren't in the set (e.g. from a newer version) are shown as no icon. */
export function toProfileIcon(value: string | null | undefined): string | undefined {
  return PROFILE_ICONS.some(({ icon }) => icon === value) ? (value ?? undefined) : undefined;
}
