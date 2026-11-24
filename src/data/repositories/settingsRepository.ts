import type { NewWordsListSize } from '../../domain/newWordsList';
import { DEFAULT_NEW_WORDS_LIST_SIZE, NEW_WORDS_LIST_SIZES } from '../../domain/newWordsList';
import type { PracticeSetSize } from '../../domain/practiceSetBuilder';
import { DEFAULT_PRACTICE_SET_SIZE, PRACTICE_SET_SIZES } from '../../domain/practiceSetBuilder';
import { WordSort } from '../../domain/wordSort';
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
  /** How many words the New Words list holds at most. */
  newWordsListSize: NewWordsListSize;
  /** Show the Zhuyin study list (only while pronunciation isn't shown as zhuyin alone). */
  learnZhuyin: boolean;
  /** All words view options. */
  allWordsShowsScriptStudyCards: boolean;
  allWordsShowsComponents: boolean;
  allWordsShowsRetentionWords: boolean;
  allWordsShowsLearningLevel: boolean;
  /** How All words orders the words. */
  allWordsSort: WordSort;
  /** The order within each level when All words is sorted by learning level. */
  allWordsSubSort: WordSort;
  /** The Challenges add-on (games with another profile) is turned on, so the Challenges tab shows. */
  isGamesAddOnEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  phoneticDisplay: PhoneticDisplay.Pinyin,
  simplifiedDisplay: SimplifiedDisplay.Hidden,
  defaultPracticeSetSize: DEFAULT_PRACTICE_SET_SIZE,
  newWordsListSize: DEFAULT_NEW_WORDS_LIST_SIZE,
  learnZhuyin: false,
  allWordsShowsScriptStudyCards: true,
  allWordsShowsComponents: true,
  allWordsShowsRetentionWords: true,
  allWordsShowsLearningLevel: true,
  allWordsSort: WordSort.Newest,
  allWordsSubSort: WordSort.Newest,
  isGamesAddOnEnabled: false,
};

type BooleanSettingKey = {
  [Key in keyof AppSettings]: AppSettings[Key] extends boolean ? Key : never;
}[keyof AppSettings];

const BOOLEAN_SETTING_KEYS: readonly BooleanSettingKey[] = [
  'learnZhuyin',
  'allWordsShowsScriptStudyCards',
  'allWordsShowsComponents',
  'allWordsShowsRetentionWords',
  'allWordsShowsLearningLevel',
  'isGamesAddOnEnabled',
];

function oneOf<T extends string | number | boolean>(
  allowed: readonly T[],
  value: unknown,
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Ignores unknown or invalid stored values so a bad row can never break the app. */
function parseSettings(storedValues: Record<string, unknown>): AppSettings {
  const booleans = Object.fromEntries(
    BOOLEAN_SETTING_KEYS.map((key) => [
      key,
      oneOf([true, false], storedValues[key], DEFAULT_SETTINGS[key]),
    ]),
  ) as Pick<AppSettings, BooleanSettingKey>;
  return {
    ...booleans,
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
    newWordsListSize: oneOf(
      NEW_WORDS_LIST_SIZES,
      storedValues.newWordsListSize,
      DEFAULT_SETTINGS.newWordsListSize,
    ),
    allWordsSort: oneOf(
      Object.values(WordSort),
      storedValues.allWordsSort,
      DEFAULT_SETTINGS.allWordsSort,
    ),
    allWordsSubSort: oneOf(
      Object.values(WordSort),
      storedValues.allWordsSubSort,
      DEFAULT_SETTINGS.allWordsSubSort,
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

  /**
   * Bookkeeping values kept per profile beside the settings but not shown as settings, such as
   * which pack version the profile's saved readings were last updated for.
   */
  async function loadInternalValue(profileId: number, key: string): Promise<string | null> {
    const row = await database.getFirst<{ value: string }>(
      'SELECT value FROM settings WHERE profile_id = ? AND key = ?',
      [profileId, key],
    );
    if (!row) return null;
    const value: unknown = JSON.parse(row.value);
    return typeof value === 'string' ? value : null;
  }

  async function saveInternalValue(profileId: number, key: string, value: string): Promise<void> {
    await database.run(
      `INSERT INTO settings (profile_id, key, value) VALUES (?, ?, ?)
       ON CONFLICT (profile_id, key) DO UPDATE SET value = excluded.value`,
      // Stored as JSON like every settings value, so loadSettings can read the whole table.
      [profileId, key, JSON.stringify(value)],
    );
  }

  return { loadSettings, saveSetting, loadInternalValue, saveInternalValue };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
