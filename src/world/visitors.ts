// Visitors: little critters who drop by now and then while you're away.
// Some ask a small favour; it is always fine to just wave.

import { HOUR } from '../domain/pet';
import { seeded } from './random';

export type VisitorId = 'bramble' | 'lumen' | 'tock' | 'fennel' | 'wisp';
export interface Favour {
  /** A food to share (always in the Pantry) or nothing. */
  food: string;
}
export interface Visit {
  id: VisitorId;
  at: number;
  favour: Favour | null;
}

export const VISITORS: readonly { id: VisitorId; likes: readonly string[] }[] = [
  { id: 'bramble', likes: ['clover-salad', 'moss-soup', 'pear-slice'] },
  { id: 'lumen', likes: ['honey-drop', 'milk-drop'] },
  { id: 'tock', likes: ['pumpkin-seeds', 'acorn-bread'] },
  { id: 'fennel', likes: ['berry-bowl', 'plum'] },
  { id: 'wisp', likes: ['oat-cake', 'cheese-crumb'] },
];

/** Away at least this long, and someone may have come by. */
export const VISIT_AFTER = 2 * HOUR;
/** A visit lasts this long, unless you wave them off. */
export const VISIT_LENGTH = 8 * HOUR;
const CHANCE = 0.45;

function dayOf(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Whether someone is visiting on your return. At most one visitor a day, and
 * the same answer for the same pet on the same day.
 */
export function maybeVisit(petId: string, now: number, away: number, lastVisit: number | undefined): Visit | null {
  if (away < VISIT_AFTER) return null;
  if (lastVisit !== undefined && dayOf(lastVisit) === dayOf(now)) return null;
  const random = seeded(`${petId}:visit:${dayOf(now)}`);
  if (random() >= CHANCE) return null;
  const who = VISITORS[Math.floor(random() * VISITORS.length)]!;
  const favour = random() < 0.6 ? { food: who.likes[Math.floor(random() * who.likes.length)]! } : null;
  return { id: who.id, at: now, favour };
}

export function stillHere(visit: Visit | null, now: number): boolean {
  return !!visit && now - visit.at < VISIT_LENGTH;
}
