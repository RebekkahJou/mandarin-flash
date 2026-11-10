import * as Font from 'expo-font';

import type { LoadedPack, PackFont } from '../services/packs/loadedPack';

async function tryRegister(font: PackFont): Promise<boolean> {
  try {
    await Font.loadAsync({ [font.family]: font.uri });
    return true;
  } catch {
    // A font the phone can't read only means cards skip it; the rest of the pack still works.
    return false;
  }
}

/** Registers a pack's fonts and returns the pack with only the fonts that loaded. */
export async function withRegisteredFonts(pack: LoadedPack): Promise<LoadedPack> {
  const registeredFonts: PackFont[] = [];
  for (const font of pack.fonts) {
    if (await tryRegister(font)) registeredFonts.push(font);
  }
  return { ...pack, fonts: registeredFonts };
}
