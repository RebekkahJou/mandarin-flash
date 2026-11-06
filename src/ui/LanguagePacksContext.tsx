import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import type { LoadedPack } from '../services/packs/loadedPack';

export interface LanguagePacks {
  /** Every open pack: the built-in Mandarin pack and any the user installed. */
  packs: readonly LoadedPack[];
}

const LanguagePacksContext = createContext<LanguagePacks | null>(null);

interface LanguagePacksProviderProps {
  initialPacks: readonly LoadedPack[];
  children: ReactNode;
}

/** Holds the open language packs for the whole app, whichever profile is active. */
export function LanguagePacksProvider({ initialPacks, children }: LanguagePacksProviderProps) {
  const [packs] = useState(initialPacks);
  const value = useMemo(() => ({ packs }), [packs]);
  return <LanguagePacksContext.Provider value={value}>{children}</LanguagePacksContext.Provider>;
}

export function useLanguagePacks(): LanguagePacks {
  const value = useContext(LanguagePacksContext);
  if (!value) throw new Error('useLanguagePacks must be used inside LanguagePacksProvider.');
  return value;
}
