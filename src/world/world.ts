// The pet's world beyond its needs: what it has found, what you've seen it
// get up to, and (in later parts) the nook's furniture, the garden and its
// wardrobe. Pure functions on plain data; src/state/world.svelte.ts keeps
// the reactive copy and saves it.

import { DAY, HOUR, isNight, type Pet, type Schedule } from '../domain/pet';
import { seeded } from './random';
import { pickTreasure } from './treasures';
import { newArcade, type Arcade } from './arcade';
import { DECOR, type DecorId } from './decor';
import { PLOTS, SEEDS, newGarden, type Garden } from './garden';
import { CLOTHES, newWardrobe, type Wardrobe } from './wardrobe';
import { VISITORS, type Visit } from './visitors';
import { KEEP, type Book, type Dish, type Postcard } from './siblings';

export interface Find {
  id: string;
  treasureId: string;
  at: number;
}

export interface World {
  id: 'world';
  /** Foraging is counted from here: while the app is open it stays with you. */
  lastForage: number;
  /** Finds it is holding for you, not yet handed over. */
  waiting: Find[];
  /** The Treasures book: when each was first found, and how many. */
  treasures: Record<string, { first: number; count: number }>;
  /** Moments you've caught it at, and when first. */
  moments: Record<string, number>;
  /** When the app was last in front of you, for "back after a while". */
  lastSeen: number;
  /** Best scores and the game of the day. */
  arcade: Arcade;
  /** Tricks and how many lessons each has had (learned at LEARN_AFTER). */
  tricks: Record<string, number>;
  /** Chat: the reply you gave to each question, by index. */
  chat: Record<string, number>;
  /** The nook's things that are out, and where (fractions of the room). */
  decor: Partial<Record<DecorId, { x: number; y: number }>>;
  garden: Garden;
  wardrobe: Wardrobe;
  /** Who is visiting now, if anyone. */
  visit: Visit | null;
  /** When the last visit began: one a day at most. */
  lastVisit?: number;
  /** Visitors met, and favours done for each. */
  visitors: Record<string, { met: number; favours: number }>;
  /** Dishes you cooked in Mise and added to the Pantry, newest first. */
  dishes: Dish[];
  /** Books you finished in BookShelf or Rosetta and gave it to read, newest first. */
  books: Book[];
  /** Postcards from places you went (Waymark), kept in the Treasures, newest first. */
  postcards: Postcard[];
}

/** It wanders off for a find every few hours you're away (not at night). */
export const FORAGE_EVERY = 3 * HOUR;
/** It holds at most this many finds for you. */
export const MAX_WAITING = 3;
/** Away at least this long, and it is caught in a little moment on return. */
export const MOMENT_AFTER = 20 * 60_000;

export function newWorld(now: number): World {
  return { id: 'world', lastForage: now, waiting: [], treasures: {}, moments: {}, lastSeen: now, arcade: newArcade(), tricks: {}, chat: {}, decor: {}, garden: newGarden(), wardrobe: newWardrobe(), visit: null, visitors: {}, dishes: [], books: [], postcards: [] };
}

/** World data read back from storage or a backup, with anything missing filled in. */
export function normaliseWorld(raw: unknown, now = Date.now()): World {
  const base = newWorld(now);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<World>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const record = <T>(v: unknown): Record<string, T> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, T>) : {});
  return {
    ...base,
    ...r,
    id: 'world',
    lastForage: num(r.lastForage, now),
    lastSeen: num(r.lastSeen, now),
    waiting: Array.isArray(r.waiting) ? r.waiting.filter((f) => f && typeof f.id === 'string' && typeof f.treasureId === 'string').slice(0, MAX_WAITING + 2) : [],
    treasures: record(r.treasures),
    moments: record(r.moments),
    arcade: { ...newArcade(), ...record<never>(r.arcade), best: record(r.arcade?.best), played: record(r.arcade?.played) },
    tricks: record(r.tricks),
    chat: record(r.chat),
    decor: Object.fromEntries(
      Object.entries(record<{ x: number; y: number }>(r.decor)).filter(([id, p]) => DECOR.some((d) => d.id === id) && p && typeof p.x === 'number' && typeof p.y === 'number'),
    ),
    garden: {
      plots: Array.from({ length: PLOTS }, (_, i) => {
        const p = Array.isArray(r.garden?.plots) ? r.garden.plots[i] : null;
        return p && SEEDS.some((s) => s.id === p.seed) && typeof p.plantedAt === 'number' ? p : null;
      }),
      harvested: record(r.garden?.harvested),
    },
    visit: r.visit && VISITORS.some((v) => v.id === r.visit!.id) && typeof r.visit.at === 'number' ? r.visit : null,
    lastVisit: typeof r.lastVisit === 'number' ? r.lastVisit : undefined,
    visitors: record(r.visitors),
    dishes: Array.isArray(r.dishes) ? r.dishes.filter((d) => d && typeof d.id === 'string' && typeof d.name === 'string').slice(0, KEEP) : [],
    books: Array.isArray(r.books) ? r.books.filter((b) => b && typeof b.title === 'string').slice(0, KEEP) : [],
    postcards: Array.isArray(r.postcards)
      ? r.postcards.filter((c) => c && typeof c.id === 'string' && typeof c.city === 'string' && typeof c.country === 'string' && typeof c.date === 'string' && typeof c.at === 'number').slice(0, KEEP)
      : [],
    wardrobe: {
      wearing: Object.fromEntries(Object.entries(record<string>(r.wardrobe?.wearing)).filter(([slot, id]) => CLOTHES.some((c) => c.id === id && c.slot === slot))),
      kept: record(r.wardrobe?.kept),
    },
  };
}

/**
 * The finds from time spent apart, up to `now`. Deterministic: the same pet
 * over the same hours brings back the same things.
 */
export function forage(world: World, pet: Pet, now: number, schedule: Schedule): World {
  if (pet.stage === 'seedpod' || now <= world.lastForage) return world;
  let t = Math.max(world.lastForage, now - 14 * DAY);
  const waiting = [...world.waiting];
  while (t + FORAGE_EVERY <= now) {
    t += FORAGE_EVERY;
    if (waiting.length >= MAX_WAITING || isNight(t, schedule)) continue;
    const random = seeded(`${pet.id}:${t}`);
    waiting.push({ id: `${pet.id}:${t}`, treasureId: pickTreasure(t, random()).id, at: t });
  }
  return { ...world, waiting, lastForage: t };
}

/** While the app is open it stays with you: nothing is counted towards a find. */
export function stayed(world: World, now: number): World {
  return { ...world, lastForage: Math.max(world.lastForage, now), lastSeen: now };
}

/** Hands over the oldest find: it goes into the Treasures book. */
export function receive(world: World): { world: World; find: Find | null; isNew: boolean } {
  const [find, ...rest] = world.waiting;
  if (!find) return { world, find: null, isNew: false };
  const had = world.treasures[find.treasureId];
  return {
    world: { ...world, waiting: rest, treasures: { ...world.treasures, [find.treasureId]: { first: had?.first ?? find.at, count: (had?.count ?? 0) + 1 } } },
    find,
    isNew: !had,
  };
}

/** When the next find would be ready, if you left now: for an invitation. */
export function nextFindAt(world: World, now: number, schedule: Schedule): number | null {
  if (world.waiting.length >= MAX_WAITING) return null;
  let t = now + FORAGE_EVERY;
  for (let i = 0; i < 16 && isNight(t, schedule); i++) t += HOUR;
  return isNight(t, schedule) ? null : t;
}

/**
 * Cozy's invitations: good news only, at most one a day for the next two
 * days, at the moment its next find would be ready.
 */
export function planInvitations(world: World, now: number, schedule: Schedule): number[] {
  const first = nextFindAt(world, now, schedule);
  if (first === null) return [];
  const second = first + DAY;
  return isNight(second, schedule) ? [first] : [first, second];
}
