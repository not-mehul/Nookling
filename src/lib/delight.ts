// Nookling's moments of delight and its easter eggs (style.md §11.3). The
// animations come from dusk-dawn and all of them respect reduced motion; the
// toast always says what happened, so nothing is only visual.

import { celebrate, createEggs, type CelebrateOptions } from 'dusk-dawn/expressive';
import { t, type MessageKey } from '../i18n/index.svelte';
import { ui } from '../state/ui.svelte';
import { siblingProp } from '../domain/delights';

export const EGGS = ['konami', 'title', 'sibling', 'birthday'] as const;
export type Egg = (typeof EGGS)[number];

const eggs = createEggs('nookling', EGGS);

/** Confetti like a nook: puffs of fluff, leaves and little stars. */
export const NOOK: CelebrateOptions = {
  shapes: ['puffy', 'circle', 'clover-4', 'soft-burst'],
  colours: ['--accent-bright', '--accent-amber', '--accent-sage', '--pet-fur'],
  glyphs: ['✦', '❦'],
};

/** An easter egg hatches: its toast, with the count the first time it's found. */
export function hatchEgg(id: Egg, message: string): void {
  const { isNew, found, total } = eggs.find(id);
  ui.notify(isNew ? `${message} ${t('egg.found', { found, total })}` : message, 'celebrate');
}

const APP_NAMES: Record<string, string> = { mise: 'Mise', bookshelf: 'BookShelf', waymark: 'Waymark', ledger: 'Ledger', colophon: 'Colophon', rosetta: 'Rosetta' };

/** Named after a sibling app: it dresses the part. */
export function siblingEgg(name: string): void {
  const prop = siblingProp(name);
  if (prop) hatchEgg('sibling', t(`egg.sibling.${prop}` as MessageKey, { app: APP_NAMES[prop] ?? prop }));
}

export function eggsFound(): number {
  return eggs.found().length;
}

/** A real accomplishment: confetti, from where it happened. */
export function cheer(origin?: Element | null, options: CelebrateOptions = {}): void {
  void celebrate({ ...NOOK, origin: origin ?? undefined, ...options });
}
