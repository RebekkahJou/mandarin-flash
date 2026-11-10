import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { openDictionaryDatabase, openUserDatabase } from '../data/openDatabases';
import type { PracticeSessionRepository } from '../data/repositories/practiceSessionRepository';
import { createPracticeSessionRepository } from '../data/repositories/practiceSessionRepository';
import type { ProfileRepository } from '../data/repositories/profileRepository';
import { createProfileRepository } from '../data/repositories/profileRepository';
import type { ReviewEventRepository } from '../data/repositories/reviewEventRepository';
import { createReviewEventRepository } from '../data/repositories/reviewEventRepository';
import type { AppSettings, SettingsRepository } from '../data/repositories/settingsRepository';
import {
  DEFAULT_SETTINGS,
  createSettingsRepository,
} from '../data/repositories/settingsRepository';
import type { WordListRepository } from '../data/repositories/wordListRepository';
import { createWordListRepository } from '../data/repositories/wordListRepository';
import type { WordRepository } from '../data/repositories/wordRepository';
import { createWordRepository } from '../data/repositories/wordRepository';
import type { SqlDatabase } from '../data/sqlDatabase';
import type { LanguageId } from '../domain/language';
import type { Profile } from '../domain/profileGroups';
import type { DictionaryLookup } from '../services/dictionaryLookup';
import { createDictionaryLookup } from '../services/dictionaryLookup';
import type { LanguageAdapter } from '../services/languages/languageAdapter';
import { languageBundleFor } from '../services/languages/languageBundles';

/** Everything that doesn't depend on which profile is active; opened once at startup. */
export interface AppCore {
  profileRepository: ProfileRepository;
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
  practiceSessionRepository: PracticeSessionRepository;
  reviewEventRepository: ReviewEventRepository;
  settingsRepository: SettingsRepository;
  dictionaryDatabase: SqlDatabase;
  /** Most recently used first. */
  initialProfiles: Profile[];
}

/** What screens and hooks use while a profile is active. */
export interface AppServices {
  profileId: number;
  /** Text handling for the profile's language. */
  languageBundle: LanguageAdapter;
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
  practiceSessionRepository: PracticeSessionRepository;
  reviewEventRepository: ReviewEventRepository;
  settingsRepository: SettingsRepository;
  dictionaryLookup: DictionaryLookup;
}

async function createAppCore(): Promise<AppCore> {
  const [userDatabase, dictionaryDatabase] = await Promise.all([
    openUserDatabase(),
    openDictionaryDatabase(),
  ]);
  const profileRepository = createProfileRepository(userDatabase);
  return {
    profileRepository,
    wordRepository: createWordRepository(userDatabase),
    wordListRepository: createWordListRepository(userDatabase),
    practiceSessionRepository: createPracticeSessionRepository(userDatabase),
    reviewEventRepository: createReviewEventRepository(userDatabase),
    settingsRepository: createSettingsRepository(userDatabase),
    dictionaryDatabase,
    initialProfiles: await profileRepository.listProfiles(),
  };
}

export type AppCoreState =
  | { status: 'loading' }
  | { status: 'failed'; errorMessage: string }
  | { status: 'ready'; core: AppCore };

export function useAppCoreLoader(): AppCoreState {
  const [state, setState] = useState<AppCoreState>({ status: 'loading' });
  useEffect(() => {
    createAppCore()
      .then((core) => setState({ status: 'ready', core }))
      .catch((error: unknown) =>
        setState({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
  }, []);
  return state;
}

function createProfileServices(
  core: AppCore,
  profileId: number,
  languageId: LanguageId,
): AppServices {
  const languageBundle = languageBundleFor(languageId);
  return {
    profileId,
    languageBundle,
    wordRepository: core.wordRepository,
    wordListRepository: core.wordListRepository,
    practiceSessionRepository: core.practiceSessionRepository,
    reviewEventRepository: core.reviewEventRepository,
    settingsRepository: core.settingsRepository,
    dictionaryLookup: createDictionaryLookup(
      core.dictionaryDatabase,
      languageBundle.dictionaryForm,
    ),
  };
}

const AppServicesContext = createContext<AppServices | null>(null);

interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface AppServicesProviderProps {
  core: AppCore;
  profileId: number;
  languageId: LanguageId;
  children: ReactNode;
}

/**
 * Provides one profile's services and settings to the screens below it. Keyed on id and language
 * rather than the profile object, so refreshing the profile list doesn't reload everything.
 */
export function AppServicesProvider({
  core,
  profileId,
  languageId,
  children,
}: AppServicesProviderProps) {
  const services = useMemo(
    () => createProfileServices(core, profileId, languageId),
    [core, profileId, languageId],
  );
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    services.settingsRepository.loadSettings(services.profileId).then(setSettings);
  }, [services]);

  const updateSetting = useCallback(
    <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
      setSettings((current) => ({ ...current, [key]: value }));
      void services.settingsRepository.saveSetting(services.profileId, key, value);
    },
    [services],
  );

  const settingsValue = useMemo(() => ({ settings, updateSetting }), [settings, updateSetting]);

  return (
    <AppServicesContext.Provider value={services}>
      <SettingsContext.Provider value={settingsValue}>{children}</SettingsContext.Provider>
    </AppServicesContext.Provider>
  );
}

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (!services) throw new Error('useAppServices must be used while a profile is active.');
  return services;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used while a profile is active.');
  return value;
}
