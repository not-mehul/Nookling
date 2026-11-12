// How the pet looks and what its status line says, from its state. Pure, so
// the Nook, share cards and tests agree.

import { LOW, NEEDS, type Need, type Pet, type PetEvent } from '../domain/pet';
import type { Expression } from './types';

/** The resting face for the pet's state: the lowest need wins. */
export function restingFace(pet: Pet): Expression {
  if (pet.stage === 'seedpod') return 'content';
  if (pet.asleep) return 'asleep';
  if (pet.unwell) return 'unwell';
  const low = NEEDS.filter((n) => pet.needs[n] < LOW).sort((a, b) => pet.needs[a] - pet.needs[b])[0];
  if (low === 'energy') return 'sleepy';
  if (low === 'fullness') return 'hungry';
  if (low === 'mood') return 'sad';
  if (low === 'tidiness') return 'grumpy';
  return 'content';
}

export type Status = 'seedpod' | 'away' | 'asleep' | 'unwell' | 'tired' | 'hungry' | 'bored' | 'grubby' | 'thriving' | 'content';

/** Which status line to show. */
export function status(pet: Pet): Status {
  if (pet.stage === 'seedpod') return 'seedpod';
  if (pet.awayUntil) return 'away';
  if (pet.asleep) return 'asleep';
  if (pet.unwell) return 'unwell';
  const face = restingFace(pet);
  if (face === 'sleepy') return 'tired';
  if (face === 'hungry') return 'hungry';
  if (face === 'sad') return 'bored';
  if (face === 'grumpy') return 'grubby';
  return NEEDS.every((n) => pet.needs[n] >= 0.75) ? 'thriving' : 'content';
}

/** Dust and smudges, 0 to 1, from tidiness and the messes about. */
export function grubbiness(pet: Pet): number {
  return Math.min(1, Math.max(0, (0.85 - pet.needs.tidiness) / 0.7));
}

/** The mood glow, 0 to 1. */
export function glowFor(pet: Pet): number {
  const base = pet.needs.mood * 0.7 + pet.bond * 0.3;
  return Math.max(0.08, pet.unwell ? base * 0.3 : pet.asleep ? base * 0.4 : base);
}

/** The words for each need's level, by message key. */
export const NEED_WORDS: Record<Need, Record<'full' | 'fine' | 'low' | 'empty', string>> = {
  fullness: { full: 'need.fullness.full', fine: 'need.fullness.fine', low: 'need.fullness.low', empty: 'need.fullness.empty' },
  energy: { full: 'need.energy.full', fine: 'need.energy.fine', low: 'need.energy.low', empty: 'need.energy.empty' },
  mood: { full: 'need.mood.full', fine: 'need.mood.fine', low: 'need.mood.low', empty: 'need.mood.empty' },
  tidiness: { full: 'need.tidiness.full', fine: 'need.tidiness.fine', low: 'need.tidiness.low', empty: 'need.tidiness.empty' },
};

/** What happened while the app was closed, counted, in the order worth telling. */
export function summarise(events: PetEvent[]): { kind: string; count: number }[] {
  const order = ['back-from-sitter', 'grew', 'fell-asleep', 'hungry', 'tired', 'bored', 'mess', 'unwell', 'recovered'];
  const counts = new Map<string, number>();
  for (const e of events) if (order.includes(e.kind)) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
  return order.filter((k) => counts.has(k)).map((kind) => ({ kind, count: counts.get(kind)! }));
}
