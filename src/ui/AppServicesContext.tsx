import * as Crypto from 'expo-crypto';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createExpoPackFileStore } from '../data/expoPackFileStore';
import { openBuiltInPack, openUserDatabase } from '../data/openDatabases';
import { createInstalledPackRepository } from '../data/repositories/installedPackRepository';
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
import type { LanguageId } from '../domain/language';
import type { Profile } from '../domain/profileGroups';
import type { DictionaryLookup } from '../services/dictionaryLookup';
import type { CardFontFamily } from '../services/fontRotation';
import { cardFontRotation } from '../services/fontRotation';
import { createDictionaryLookup } from '../services/dictionaryLookup';
import type { LanguageAdapter } from '../services/languages/languageAdapter';
import { languageBundleFor } from '../services/languages/languageBundles';
import type { LoadedPack } from '../services/packs/loadedPack';
import { packForLanguage } from '../services/packs/loadedPack';
import type { PackInstaller } from '../services/packs/packInstaller';
import { createPackInstaller } from '../services/packs/packInstaller';
import { setSha512ForSignatures } from '../services/packs/packSignature';
import { TRUSTED_PACK_PUBLIC_KEYS } from '../services/packs/trustedPackKeys';
import { useLanguagePacks } from './LanguagePacksContext';
import { withRegisteredFonts } from './packFonts';

/** Everything that doesn't depend on which profile is active; opened once at startup. */
export interface AppCore {
  profileRepository: ProfileRepository;
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
  practiceSessionRepository: PracticeSessionRepository;
  reviewEventRepository: ReviewEventRepository;
  settingsRepository: SettingsRepository;
  /** Language packs open at startup: the built-in pack, then installed ones. */
  initialPacks: LoadedPack[];
  packInstaller: PackInstaller;
  /** Most recently used first. */
  initialProfiles: Profile[];
}

/** What screens and hooks use while a profile is active. */
export interface AppServices {
  profileId: number;
  /** Text handling for the profile's language. */
  languageBundle: LanguageAdapter;
  /** Font families flashcards rotate through for this language. */
  cardFonts: readonly CardFontFamily[];
  wordRepository: WordRepository;
  wordListRepository: WordListRepository;
  practiceSessionRepository: PracticeSessionRepository;
  reviewEventRepository: ReviewEventRepository;
  settingsRepository: SettingsRepository;
  dictionaryLookup: DictionaryLookup;
}

/** Native SHA-512 for signature checks. Messages are short, so copying them costs nothing. */
async function sha512(message: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA512, new Uint8Array(message));
  return new Uint8Array(digest);
}

async function createAppCore(): Promise<AppCore> {
  setSha512ForSignatures(sha512);
  const [userDatabase, builtInPack] = await Promise.all([openUserDatabase(), openBuiltInPack()]);
  const profileRepository = createProfileRepository(userDatabase);
  const packInstaller = createPackInstaller({
    fileStore: createExpoPackFileStore(),
    installedPackRepository: createInstalledPackRepository(userDatabase),
    trustedPublicKeys: TRUSTED_PACK_PUBLIC_KEYS,
  });
  const installedPacks = await Promise.all(
    (await packInstaller.loadInstalledPacks()).map(withRegisteredFonts),
  );
  return {
    profileRepository,
    wordRepository: createWordRepository(userDatabase),
    wordListRepository: createWordListRepository(userDatabase),
    practiceSessionRepository: createPracticeSessionRepository(userDatabase),
    reviewEventRepository: createReviewEventRepository(userDatabase),
    settingsRepository: createSettingsRepository(userDatabase),
    initialPacks: [{ ...builtInPack, isBuiltIn: true, fonts: [] }, ...installedPacks],
    packInstaller,
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
  packs: readonly LoadedPack[],
  profileId: number,
  languageId: LanguageId,
): AppServices {
  const languageBundle = languageBundleFor(languageId);
  const pack = packForLanguage(packs, languageId);
  // Mandarin is built in, so only a broken build could have a language without a pack.
  if (!pack) throw new Error(`No language pack for ${languageBundle.definition.name}.`);
  return {
    profileId,
    languageBundle,
    cardFonts: cardFontRotation(
      languageBundle.usesBundledFonts,
      pack.fonts.map((font) => font.family),
    ),
    wordRepository: core.wordRepository,
    wordListRepository: core.wordListRepository,
    practiceSessionRepository: core.practiceSessionRepository,
    reviewEventRepository: core.reviewEventRepository,
    settingsRepository: core.settingsRepository,
    dictionaryLookup: createDictionaryLookup(
      pack.database,
      languageBundle.dictionaryForm,
      pack.metadata.reliablePartsOfSpeech,
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
  const { packs } = useLanguagePacks();
  const services = useMemo(
    () => createProfileServices(core, packs, profileId, languageId),
    [core, packs, profileId, languageId],
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
