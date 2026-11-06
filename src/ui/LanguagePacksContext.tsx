import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { PackRejectedError } from '../domain/packMetadata';
import { packRemovalProblem } from '../domain/packInstallRules';
import type { LoadedPack } from '../services/packs/loadedPack';
import type { AppCore } from './AppServicesContext';

export interface LanguagePacks {
  /** Every open pack: the built-in Mandarin pack and any the user installed. */
  packs: readonly LoadedPack[];
  /** Verifies and installs a pack file. Throws PackRejectedError with a message for the user. */
  installPack: (sourceUri: string) => Promise<LoadedPack>;
  /** Throws PackRejectedError when profiles still need the pack. */
  removePack: (pack: LoadedPack) => Promise<void>;
}

const LanguagePacksContext = createContext<LanguagePacks | null>(null);

interface LanguagePacksProviderProps {
  core: AppCore;
  children: ReactNode;
}

/** Holds the open language packs for the whole app, whichever profile is active. */
export function LanguagePacksProvider({ core, children }: LanguagePacksProviderProps) {
  const [packs, setPacks] = useState<readonly LoadedPack[]>(core.initialPacks);

  const installPack = useCallback(
    async (sourceUri: string) => {
      const installed = await core.packInstaller.install(sourceUri, packs);
      setPacks((current) => [...current, installed]);
      return installed;
    },
    [core, packs],
  );

  const removePack = useCallback(
    async (pack: LoadedPack) => {
      const profiles = await core.profileRepository.listProfiles();
      const languageIdsInUse = new Set<string>(profiles.map((profile) => profile.languageId));
      const problem = packRemovalProblem(pack, packs, languageIdsInUse);
      if (problem) throw new PackRejectedError(problem);
      await core.packInstaller.remove(pack);
      setPacks((current) => current.filter((other) => other !== pack));
    },
    [core, packs],
  );

  const value = useMemo(
    () => ({ packs, installPack, removePack }),
    [packs, installPack, removePack],
  );
  return <LanguagePacksContext.Provider value={value}>{children}</LanguagePacksContext.Provider>;
}

export function useLanguagePacks(): LanguagePacks {
  const value = useContext(LanguagePacksContext);
  if (!value) throw new Error('useLanguagePacks must be used inside LanguagePacksProvider.');
  return value;
}
