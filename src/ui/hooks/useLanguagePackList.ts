import { useState } from 'react';

import type { LoadedPack } from '../../services/packs/loadedPack';
import {
  packFailureMessage,
  packInstalledMessage,
  packLanguageNames,
} from '../../services/packs/packMessages';
import { confirm, showMessage } from '../confirm';
import { useLanguagePacks } from '../LanguagePacksContext';
import { pickPackFile } from '../packFiles';

export interface LanguagePackRowData {
  key: string;
  title: string;
  details: string;
  canRemove: boolean;
  pack: LoadedPack;
}

function toRow(pack: LoadedPack): LanguagePackRowData {
  const { metadata } = pack;
  const origin = pack.isBuiltIn ? 'Built in' : 'Installed';
  return {
    key: `${metadata.packId}-${metadata.packVersion}`,
    title: `${metadata.title} · version ${metadata.packVersion}`,
    details: `${origin}. ${packLanguageNames(metadata)}.`,
    canRemove: !pack.isBuiltIn,
    pack,
  };
}

/** The Language packs screen: what's installed, installing a pack file and removing packs. */
export function useLanguagePackList() {
  const { packs, installPack, removePack } = useLanguagePacks();
  const [isInstalling, setIsInstalling] = useState(false);

  const chooseAndInstall = async () => {
    setIsInstalling(true);
    try {
      await pickPackFile(async (uri) => {
        const installed = await installPack(uri);
        showMessage('Pack installed', packInstalledMessage(installed.metadata));
      });
    } catch (error) {
      showMessage('Not installed', packFailureMessage(error));
    } finally {
      setIsInstalling(false);
    }
  };

  const remove = async (pack: LoadedPack) => {
    const title = pack.metadata.title;
    const isConfirmed = await confirm(
      `Remove the ${title} pack?`,
      'Your words and progress stay. You can install the pack again later.',
      'Remove',
    );
    if (!isConfirmed) return;
    try {
      await removePack(pack);
    } catch (error) {
      showMessage('Not removed', packFailureMessage(error));
    }
  };

  return { rows: packs.map(toRow), isInstalling, chooseAndInstall, remove };
}
