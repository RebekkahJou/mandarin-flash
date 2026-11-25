import { routeForIncomingLink } from '../services/packs/packLinks';
import { routeForSharedTextLink, sharedTextInbox } from '../services/sharedText';

/**
 * Expo Router calls this for every link the system opens the app with, including a downloaded
 * language pack the user opens with Mandarin Flash and text shared from another app.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return routeForSharedTextLink(path, sharedTextInbox) ?? routeForIncomingLink(path);
  } catch {
    // Throwing here would crash the app; an unreadable link just opens the start screen.
    return '/';
  }
}
