import { useEffect, useRef, useState } from 'react';

import { packFailureMessage, packInstalledMessage } from '../../services/packs/packMessages';
import { useLanguagePacks } from '../LanguagePacksContext';

export enum PackInstallStatus {
  Installing = 'installing',
  Installed = 'installed',
  Failed = 'failed',
}

export interface PackInstallState {
  status: PackInstallStatus;
  message: string;
}

const INSTALLING_STATE: PackInstallState = {
  status: PackInstallStatus.Installing,
  message: 'Checking and installing the language pack…',
};
const NO_FILE_STATE: PackInstallState = {
  status: PackInstallStatus.Failed,
  message: 'No language pack was opened.',
};

/** Installs the pack file the user opened with the app (route B), once. */
export function usePackInstall(sourceUri: string | undefined): PackInstallState {
  const { installPack } = useLanguagePacks();
  const [state, setState] = useState(sourceUri ? INSTALLING_STATE : NO_FILE_STATE);
  // Installing reads and copies a large file; a re-render must not start it a second time.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current || !sourceUri) return;
    hasStarted.current = true;
    installPack(sourceUri)
      .then((pack) =>
        setState({
          status: PackInstallStatus.Installed,
          message: packInstalledMessage(pack.metadata),
        }),
      )
      .catch((error: unknown) =>
        setState({ status: PackInstallStatus.Failed, message: packFailureMessage(error) }),
      );
  }, [sourceUri, installPack]);

  return state;
}
