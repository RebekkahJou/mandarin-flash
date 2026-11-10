import { routeForIncomingLink } from '../services/packs/packLinks';

/**
 * Expo Router calls this for every link the system opens the app with, including a downloaded
 * language pack the user opens with Mandarin Flash.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return routeForIncomingLink(path);
  } catch {
    // Throwing here would crash the app; an unreadable link just opens the start screen.
    return '/';
  }
}
