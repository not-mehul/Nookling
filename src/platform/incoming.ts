// ============================================================
// nookling:// links from the sibling apps (style.md §14.1).
//   nookling://open, and any action Nookling doesn't know, just open the app
//   at the Nook. A link never changes anything by itself.
//   nookling://cooked?dish=…&source=mise   a dish you cooked in Mise: the Nook
//     offers to add it to the Pantry.
//   nookling://read?title=…&author=…&source=bookshelf   a book you finished
//     (in BookShelf or Rosetta): the Nook offers to give the pet something to read.
//   nookling://postcard?city=…&country=…&date=…&source=waymark   a place you
//     went: the Nook offers to keep a postcard from it in the Treasures.
// Android registers the scheme with a VIEW intent filter; links arrive
// through appUrlOpen.
// ============================================================

import { App } from '@capacitor/app';
import { parseLink } from './links';
import { isNative } from './output';

/** The app a book came from, for the card's label. */
export type BookSource = 'bookshelf' | 'rosetta';

export type NooklingLink =
  | { kind: 'open' }
  | { kind: 'cooked'; dish: string }
  | { kind: 'read'; title: string; author: string; from: BookSource }
  | { kind: 'postcard'; city: string; country: string; date: string };

/** Long enough for any real title; a link is never a place to paste a novel. */
const MAX_TEXT = 120;
const clean = (v: string | undefined) => (v ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);

/** What a nookling:// link asks for, or null for anything that isn't one. */
export function readNooklingLink(url: string): NooklingLink | null {
  const link = parseLink(url, 'nookling');
  if (!link) return null;
  const dish = clean(link.params.dish);
  if (link.action === 'cooked' && dish) return { kind: 'cooked', dish };
  const title = clean(link.params.title);
  if (link.action === 'read' && title) return { kind: 'read', title, author: clean(link.params.author), from: link.source === 'rosetta' ? 'rosetta' : 'bookshelf' };
  const city = clean(link.params.city);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(link.params.date ?? '') ? link.params.date! : '';
  if (link.action === 'postcard' && city) return { kind: 'postcard', city, country: clean(link.params.country), date };
  return { kind: 'open' };
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
