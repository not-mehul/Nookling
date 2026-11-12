// The rules behind Nookling's surprises, kept pure so they can be tested.
// What they look like is in src/pet and src/lib/delight.ts.

import { DAY, NEEDS, type Pet } from './pet';
import type { Prop } from '../pet/types';

const SIBLINGS: Record<string, Prop> = {
  mise: 'mise',
  bookshelf: 'bookshelf',
  waymark: 'waymark',
  ledger: 'ledger',
  colophon: 'colophon',
  rosetta: 'rosetta',
};

/** Named after one of the other apps? Then it wears that app's prop. */
export function siblingProp(name: string): Prop | null {
  return SIBLINGS[name.trim().toLowerCase()] ?? null;
}

/** The day it hatched, a whole number of years on. */
export function isBirthday(pet: Pet, now: number): boolean {
  if (!pet.hatchedAt) return false;
  const born = new Date(pet.hatchedAt);
  const today = new Date(now);
  return today.getFullYear() > born.getFullYear() && today.getMonth() === born.getMonth() && today.getDate() === born.getDate();
}

/** Every need at half or more. */
export function allAboveHalf(pet: Pet): boolean {
  return NEEDS.every((n) => pet.needs[n] >= 0.5);
}

/**
 * Tracks the first whole day with every need at half or more. `goodSince`
 * starts when they all are and clears when one dips; a day later, once, it's
 * a milestone. Checked at every refresh. While the app is closed needs only
 * fall, so a pet that is still above half on return was above half throughout.
 */
export function goodDay(pet: Pet, now: number): { pet: Pet; celebrate: boolean } {
  if (pet.goodDayAt || pet.stage === 'seedpod' || pet.awayUntil) return { pet, celebrate: false };
  if (!allAboveHalf(pet)) return { pet: pet.goodSince ? { ...pet, goodSince: null } : pet, celebrate: false };
  if (!pet.goodSince) return { pet: { ...pet, goodSince: now }, celebrate: false };
  if (now - pet.goodSince >= DAY) return { pet: { ...pet, goodDayAt: now }, celebrate: true };
  return { pet, celebrate: false };
}
