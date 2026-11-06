import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { LanguageId } from '../domain/language';
import type { Profile } from '../domain/profileGroups';
import type { AppCore } from './AppServicesContext';
import { AppServicesProvider } from './AppServicesContext';

export interface ProfileSession {
  /** Most recently used first. */
  profiles: Profile[];
  activeProfile: Profile | null;
  /** No profile exists yet, so the first-run screen shows. */
  showsFirstRun: boolean;
  /** Someone has to pick a profile (or add one) on the welcome screen. */
  showsWelcome: boolean;
  selectProfile: (profile: Profile) => Promise<void>;
  /** Creates one profile per name and returns them; doesn't change which profile is active. */
  addProfiles: (names: readonly string[], languageId: LanguageId) => Promise<Profile[]>;
  /** Goes back to the welcome screen to pick someone else. */
  chooseAnotherProfile: () => void;
  renameProfile: (profileId: number, name: string) => Promise<void>;
  /**
   * Deletes a profile and everything in it. If it was the active one, the only remaining profile
   * opens, or the welcome screen shows when several remain.
   */
  deleteProfile: (profileId: number) => Promise<void>;
}

const ProfileSessionContext = createContext<ProfileSession | null>(null);

/** A single profile opens straight away; with several, the welcome screen asks who is practicing. */
function onlyProfileId(profiles: readonly Profile[]): number | null {
  return profiles.length === 1 ? profiles[0].id : null;
}

function useProfileSessionState(core: AppCore): ProfileSession {
  const [profiles, setProfiles] = useState(core.initialProfiles);
  // An id rather than a profile, so a rename shows at once and a deleted profile can't linger.
  const [activeProfileId, setActiveProfileId] = useState(() => onlyProfileId(core.initialProfiles));
  const [isChoosingProfile, setIsChoosingProfile] = useState(false);

  const reloadProfiles = useCallback(async () => {
    setProfiles(await core.profileRepository.listProfiles());
  }, [core]);

  const selectProfile = useCallback(
    async (profile: Profile) => {
      await core.profileRepository.markProfileUsed(profile.id, Date.now());
      setActiveProfileId(profile.id);
      setIsChoosingProfile(false);
      await reloadProfiles();
    },
    [core, reloadProfiles],
  );

  const addProfiles = useCallback(
    async (names: readonly string[], languageId: LanguageId) => {
      const created: Profile[] = [];
      for (const name of names) {
        created.push(await core.profileRepository.createProfile(name, languageId));
      }
      await reloadProfiles();
      return created;
    },
    [core, reloadProfiles],
  );

  const chooseAnotherProfile = useCallback(() => setIsChoosingProfile(true), []);

  const renameProfile = useCallback(
    async (profileId: number, name: string) => {
      await core.profileRepository.renameProfile(profileId, name);
      await reloadProfiles();
    },
    [core, reloadProfiles],
  );

  const deleteProfile = useCallback(
    async (profileId: number) => {
      await core.profileRepository.deleteProfile(profileId);
      const remainingProfiles = await core.profileRepository.listProfiles();
      setProfiles(remainingProfiles);
      if (profileId !== activeProfileId) return;
      const nextProfileId = onlyProfileId(remainingProfiles);
      setActiveProfileId(nextProfileId);
      setIsChoosingProfile(nextProfileId === null);
    },
    [core, activeProfileId],
  );

  return useMemo(() => {
    const showsFirstRun = profiles.length === 0;
    const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? null;
    return {
      profiles,
      activeProfile,
      showsFirstRun,
      showsWelcome: !showsFirstRun && (activeProfile === null || isChoosingProfile),
      selectProfile,
      addProfiles,
      chooseAnotherProfile,
      renameProfile,
      deleteProfile,
    };
  }, [
    profiles,
    activeProfileId,
    isChoosingProfile,
    selectProfile,
    addProfiles,
    chooseAnotherProfile,
    renameProfile,
    deleteProfile,
  ]);
}

/**
 * Tracks who is practicing. While someone switches profile, the previous profile's services stay
 * provided: the app's screens are still closing at that moment and must not lose them.
 */
export function ProfileSessionProvider({ core, children }: { core: AppCore; children: ReactNode }) {
  const session = useProfileSessionState(core);
  const { activeProfile } = session;
  const content = activeProfile ? (
    <AppServicesProvider
      core={core}
      profileId={activeProfile.id}
      languageId={activeProfile.languageId}
    >
      {children}
    </AppServicesProvider>
  ) : (
    children
  );
  return <ProfileSessionContext.Provider value={session}>{content}</ProfileSessionContext.Provider>;
}

export function useProfileSession(): ProfileSession {
  const session = useContext(ProfileSessionContext);
  if (!session) throw new Error('useProfileSession must be used inside ProfileSessionProvider.');
  return session;
}
