import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { openDictionaryDatabase, openUserDatabase } from '../data/openDatabases';
import type { PracticeSessionRepository } from '../data/repositories/practiceSessionRepository';
import { createPracticeSessionRepository } from '../data/repositories/practiceSessionRepository';
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
import type { DictionaryLookup } from '../services/dictionaryLookup';
import { createDictionaryLookup } from '../services/dictionaryLookup';
import type { LanguageAdapter } from '../services/languages/languageAdapter';
import { languageBundleFor } from '../services/languages/languageBundles';

export interface AppServices {
  /** Single profile for the MVP; every query is already scoped by profile for multi-profile later. */
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

async function createAppServices(): Promise<AppServices> {
  const [userDatabase, dictionaryDatabase] = await Promise.all([
    openUserDatabase(),
    openDictionaryDatabase(),
  ]);
  const profile = await createProfileRepository(userDatabase).ensureDefaultProfile();
  return {
    profileId: profile.id,
    languageBundle: languageBundleFor(profile.languageId),
    wordRepository: createWordRepository(userDatabase),
    wordListRepository: createWordListRepository(userDatabase),
    practiceSessionRepository: createPracticeSessionRepository(userDatabase),
    reviewEventRepository: createReviewEventRepository(userDatabase),
    settingsRepository: createSettingsRepository(userDatabase),
    dictionaryLookup: createDictionaryLookup(dictionaryDatabase),
  };
}

export type AppServicesState =
  | { status: 'loading' }
  | { status: 'failed'; errorMessage: string }
  | { status: 'ready'; services: AppServices };

export function useAppServicesLoader(): AppServicesState {
  const [state, setState] = useState<AppServicesState>({ status: 'loading' });
  useEffect(() => {
    createAppServices()
      .then((services) => setState({ status: 'ready', services }))
      .catch((error: unknown) =>
        setState({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
  }, []);
  return state;
}

const AppServicesContext = createContext<AppServices | null>(null);

interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function AppServicesProvider({
  services,
  children,
}: {
  services: AppServices;
  children: ReactNode;
}) {
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
  if (!services) throw new Error('useAppServices must be used inside AppServicesProvider.');
  return services;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside AppServicesProvider.');
  return value;
}
