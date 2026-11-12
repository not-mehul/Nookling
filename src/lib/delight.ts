// Nookling's moments of delight and its easter eggs (style.md §11.3). The
// animations come from dusk-dawn and all of them respect reduced motion; the
// toast always says what happened, so nothing is only visual.

import { celebrate, createEggs, type CelebrateOptions } from 'dusk-dawn/expressive';
import { t } from '../i18n/index.svelte';
import { ui } from '../state/ui.svelte';

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

export function eggsFound(): number {
  return eggs.found().length;
}

/** A real accomplishment: confetti, from where it happened. */
export function cheer(origin?: Element | null, options: CelebrateOptions = {}): void {
  void celebrate({ ...NOOK, origin: origin ?? undefined, ...options });
}
