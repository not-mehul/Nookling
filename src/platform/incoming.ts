// ============================================================
// nookling:// links from the sibling apps (style.md §14.1).
//   nookling://open, and any action Nookling doesn't know, just open the app
//   at the Nook. A link never changes anything by itself.
// Android registers the scheme with a VIEW intent filter; links arrive
// through appUrlOpen.
// ============================================================

import { App } from '@capacitor/app';
import { parseLink } from './links';
import { isNative } from './output';

export type NooklingLink = { kind: 'open' };

/** What a nookling:// link asks for, or null for anything that isn't one. */
export function readNooklingLink(url: string): NooklingLink | null {
  return parseLink(url, 'nookling') ? { kind: 'open' } : null;
}

/** Calls `onLink` for the link Nookling was launched with, and for each one after. */
export async function listenForLinks(onLink: (link: NooklingLink) => void): Promise<void> {
  if (!isNative) return;
  const handle = (url: string | undefined) => {
    const read = url ? readNooklingLink(url) : null;
    if (read) onLink(read);
  };
  await App.addListener('appUrlOpen', (event) => handle(event.url));
  const launch = await App.getLaunchUrl().catch(() => undefined);
  handle(launch?.url);
}
