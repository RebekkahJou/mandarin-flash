import { useEffect, useMemo, useState } from 'react';

import type { StorePack } from '../../domain/storePacks';
import { STORE_PACKS, isStorePackInstalled, storePacksForBuild } from '../../domain/storePacks';
import {
  packFailureMessage,
  packInstalledMessage,
  packLanguageNames,
  storePackStatusText,
} from '../../services/packs/packMessages';
import { playAssetPacks } from '../../services/packs/playAssetPacks';
import type { StorePackProgress } from '../../services/packs/storePackDelivery';
import {
  StorePackPhase,
  UNAVAILABLE_PROGRESS,
  createStorePackDelivery,
} from '../../services/packs/storePackDelivery';
import { showMessage } from '../confirm';
import { useLanguagePacks } from '../LanguagePacksContext';

export interface StorePackRowData {
  key: string;
  title: string;
  details: string;
  /** "Get" or "Install"; null while the pack is on its way. */
  actionLabel: string | null;
  storePack: StorePack;
}

const OFFERED_STORE_PACKS = storePacksForBuild(STORE_PACKS, __DEV__);
const delivery = playAssetPacks ? createStorePackDelivery(playAssetPacks) : null;

/** What this screen is doing with a pack right now. */
enum PackActivity {
  None = 'none',
  /** Waiting for a download this screen asked Play for. */
  Downloading = 'downloading',
  Installing = 'installing',
}

/** Get also picks up a download Play started earlier, e.g. before the app was closed. */
function actionLabelFor(progress: StorePackProgress, activity: PackActivity): string | null {
  if (activity !== PackActivity.None) return null;
  if (progress.phase === StorePackPhase.Downloaded) return 'Install';
  return 'Get';
}

function toRow(storePack: StorePack, progress: StorePackProgress, activity: PackActivity) {
  const isInstalling = activity === PackActivity.Installing;
  const statusText = isInstalling ? 'Installing…' : storePackStatusText(progress);
  return {
    key: storePack.assetPackName,
    title: storePack.title,
    details: `${statusText} ${packLanguageNames(storePack)}.`,
    actionLabel: actionLabelFor(progress, activity),
    storePack,
  };
}

/**
 * Store packs Google Play can deliver to this phone (route A) that aren't installed yet, and
 * getting one: Play downloads it, then the pack installer checks and installs it like a file.
 */
export function useStorePacks() {
  const { packs, installPack } = useLanguagePacks();
  const [progressByName, setProgressByName] = useState(new Map<string, StorePackProgress>());
  const [activityByName, setActivityByName] = useState(new Map<string, PackActivity>());
  const notInstalled = useMemo(() => {
    const openVersions = packs.map((pack) => pack.metadata);
    return OFFERED_STORE_PACKS.filter(
      (storePack) => !isStorePackInstalled(storePack, openVersions),
    );
  }, [packs]);

  useEffect(() => {
    if (!delivery) return;
    let isCurrent = true;
    void delivery.readProgress(notInstalled).then((progress) => {
      if (isCurrent) setProgressByName(progress);
    });
    return () => {
      isCurrent = false;
    };
  }, [notInstalled]);

  const setProgress = (name: string, progress: StorePackProgress) =>
    setProgressByName((current) => new Map(current).set(name, progress));
  const setActivity = (name: string, activity: PackActivity) =>
    setActivityByName((current) => new Map(current).set(name, activity));

  const getPack = async (storePack: StorePack) => {
    if (!delivery) return;
    const name = storePack.assetPackName;
    setActivity(name, PackActivity.Downloading);
    try {
      const fileUri = await delivery.download(storePack, (progress) => setProgress(name, progress));
      setActivity(name, PackActivity.Installing);
      const installed = await installPack(fileUri);
      await delivery.discardDownload(storePack);
      showMessage('Pack installed', packInstalledMessage(installed.metadata));
    } catch (error) {
      showMessage('Not installed', packFailureMessage(error));
    } finally {
      setActivity(name, PackActivity.None);
    }
  };

  const rows: StorePackRowData[] = notInstalled
    .map((storePack) => ({
      storePack,
      progress: progressByName.get(storePack.assetPackName) ?? UNAVAILABLE_PROGRESS,
    }))
    .filter(({ progress }) => progress.phase !== StorePackPhase.Unavailable)
    .map(({ storePack, progress }) =>
      toRow(storePack, progress, activityByName.get(storePack.assetPackName) ?? PackActivity.None),
    );

  return { rows, getPack };
}
