import type { PracticeSetSize } from '../../domain/practiceSetBuilder';
import { DEFAULT_PRACTICE_SET_SIZE, PRACTICE_SET_SIZES } from '../../domain/practiceSetBuilder';
import type { SqlDatabase } from '../sqlDatabase';

export enum PhoneticDisplay {
  Pinyin = 'pinyin',
  Zhuyin = 'zhuyin',
  Both = 'both',
}

export enum SimplifiedDisplay {
  Hidden = 'hidden',
  CornerBadge = 'corner_badge',
  ModalButton = 'modal_button',
}

export interface AppSettings {
  phoneticDisplay: PhoneticDisplay;
  simplifiedDisplay: SimplifiedDisplay;
  defaultPracticeSetSize: PracticeSetSize;
}

export const DEFAULT_SETTINGS: AppSettings = {
  phoneticDisplay: PhoneticDisplay.Pinyin,
  simplifiedDisplay: SimplifiedDisplay.Hidden,
  defaultPracticeSetSize: DEFAULT_PRACTICE_SET_SIZE,
};

function oneOf<T extends string | number>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Ignores unknown or invalid stored values so a bad row can never break the app. */
function parseSettings(storedValues: Record<string, unknown>): AppSettings {
  return {
    phoneticDisplay: oneOf(
      Object.values(PhoneticDisplay),
      storedValues.phoneticDisplay,
      DEFAULT_SETTINGS.phoneticDisplay,
    ),
    simplifiedDisplay: oneOf(
      Object.values(SimplifiedDisplay),
      storedValues.simplifiedDisplay,
      DEFAULT_SETTINGS.simplifiedDisplay,
    ),
    defaultPracticeSetSize: oneOf(
      PRACTICE_SET_SIZES,
      storedValues.defaultPracticeSetSize,
      DEFAULT_SETTINGS.defaultPracticeSetSize,
    ),
  };
}

export function createSettingsRepository(database: SqlDatabase) {
  async function loadSettings(profileId: number): Promise<AppSettings> {
    const rows = await database.getAll<{ key: string; value: string }>(
      'SELECT key, value FROM settings WHERE profile_id = ?',
      [profileId],
    );
    const storedValues = Object.fromEntries(
      rows.map((row) => [row.key, JSON.parse(row.value) as unknown]),
    );
    return parseSettings(storedValues);
  }

  async function saveSetting<Key extends keyof AppSettings>(
    profileId: number,
    key: Key,
    value: AppSettings[Key],
  ): Promise<void> {
    await database.run(
      `INSERT INTO settings (profile_id, key, value) VALUES (?, ?, ?)
       ON CONFLICT (profile_id, key) DO UPDATE SET value = excluded.value`,
      [profileId, key, JSON.stringify(value)],
    );
  }

  return { loadSettings, saveSetting };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
