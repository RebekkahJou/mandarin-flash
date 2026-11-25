/**
 * Text shared into the app from another app's Share sheet. Android's share activity
 * (plugins/withSharedTextActivity.ts) forwards it as a link; the link handler leaves the text
 * here, in memory only, for the Find words in text screen to take.
 */

/** The link's host: `<scheme>://shared-text?text=…`. */
export const SHARED_TEXT_LINK_HOST = 'shared-text';

/** The screen that shows shared text. */
export const FIND_IN_TEXT_PATHNAME = '/words/find-in-text';

const SHARED_TEXT_LINK_PATTERN = new RegExp(
  `^[a-z][a-z0-9+.-]*://${SHARED_TEXT_LINK_HOST}\\?(.*)$`,
  'i',
);
const TEXT_PARAMETER = 'text';

function decodedOrNull(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/** The shared text in a link, or null when the link isn't a shared-text link or has no text. */
export function sharedTextFromLink(link: string): string | null {
  const query = SHARED_TEXT_LINK_PATTERN.exec(link)?.[1];
  if (query === undefined) return null;
  for (const parameter of query.split('&')) {
    const [name, value = ''] = parameter.split('=');
    if (name !== TEXT_PARAMETER) continue;
    const text = decodedOrNull(value)?.trim();
    return text ? text : null;
  }
  return null;
}

type SharedTextListener = (text: string) => void;

/** Holds the latest shared text until a screen takes it. */
export function createSharedTextInbox() {
  let pendingText: string | null = null;
  const listeners = new Set<SharedTextListener>();

  return {
    /** Hands the text to a listening screen, or keeps it for the next one that asks. */
    put(text: string) {
      const [listener] = listeners;
      if (listener) listener(text);
      else pendingText = text;
    },
    take(): string | null {
      const text = pendingText;
      pendingText = null;
      return text;
    },
    hasPending: () => pendingText !== null,
    /** A screen showing shared text gets later shares directly. Returns the unsubscribe function. */
    listen(listener: SharedTextListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type SharedTextInbox = ReturnType<typeof createSharedTextInbox>;

export const sharedTextInbox = createSharedTextInbox();

/**
 * Where a link the system opens the app with should lead when it carries shared text: the text
 * goes into the inbox and the link to the Find words in text screen. Null for other links.
 */
export function routeForSharedTextLink(link: string, inbox: SharedTextInbox): string | null {
  const text = sharedTextFromLink(link);
  if (text === null) return null;
  inbox.put(text);
  return FIND_IN_TEXT_PATHNAME;
}
