// ============================================================
// The pet and the passing of time. Pure functions only: no Svelte, no
// storage, no clock of their own. The pet's state is stored with the moment
// it was true (`asOf`), and `simulate()` replays it forward to any later
// moment, exactly, in segments split wherever a rate changes. Nothing ticks
// in the background: the app simulates on launch, on resume and every half
// minute while open, and the notification scheduler simulates ahead.
// ============================================================

import type { CoatId } from '../pet/coats';
import { clockMinutes } from './settings';
import type { Food } from './foods';
import type { Form, Stage } from '../pet/types';

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** Each 0 (empty) to 1 (full). */
export interface Needs {
  fullness: number;
  energy: number;
  mood: number;
  tidiness: number;
}
export type Need = keyof Needs;
export const NEEDS: readonly Need[] = ['fullness', 'energy', 'mood', 'tidiness'];

export type Trait = 'greedy' | 'sleepy' | 'playful' | 'tidy' | 'shy' | 'chatty';
export const TRAITS: readonly Trait[] = ['greedy', 'sleepy', 'playful', 'tidy', 'shy', 'chatty'];

/** What the care in days 3 to 10 looked like; decides the grown form (src/domain/growth.ts). */
export interface CareTally {
  /** Strokes, cuddles, boops and games. */
  attention: number;
  /** Ids of the different foods eaten. */
  foods: string[];
  /** Hours slept on schedule. */
  rest: number;
  /** Hours spent with any need below a fifth. */
  neglect: number;
}

/** Putting the pet to bed early, or keeping it up: holds until the next bedtime or wake time. */
export interface SleepOverride {
  asleep: boolean;
  until: number;
}

export interface Pet {
  id: string;
  name: string;
  /** When the seedpod appeared. */
  createdAt: number;
  /** When it hatched; null while it is a seedpod. */
  hatchedAt: number | null;
  /** Warmth from taps, 0 to 1; at 1 the seedpod hatches. */
  warmth: number;
  stage: Stage;
  form: Form | null;
  /** The colour of its fur (src/pet/coats.ts). Older pets have none and get one from their id. */
  coat?: CoatId;
  traits: Trait[];
  needs: Needs;
  /** Hidden. Falls only while two or more needs sit below a fifth. */
  health: number;
  /** Hidden. Grows with every caring touch and never falls. */
  bond: number;
  unwell: boolean;
  asleep: boolean;
  sleepOverride: SleepOverride | null;
  /** Little messes on the floor, 0 to 3. */
  messes: number;
  /** When the meal it is digesting turns into a mess. */
  messAt: number | null;
  /** After too many treats: low energy and no mood from treats until then. */
  sluggishUntil: number | null;
  /** Treats eaten recently, as times. */
  treats: number[];
  /** With a sitter until then: nothing falls. */
  awayUntil: number | null;
  care: CareTally;
  /** Since when every need has been at half or more; null once one dips. */
  goodSince?: number | null;
  /** Meals eaten, for how often a meal makes a mess in Cozy. */
  meals?: number;
  /** When it had its first whole good day (src/domain/delights.ts). */
  goodDayAt?: number | null;
  /** When this state was true. */
  asOf: number;
}

/** The person's settings that change how time passes. */
export interface Schedule {
  bedtime: string;
  wake: string;
  gentle: boolean;
  /**
   * Cozy (the app's default): needs settle at a floor instead of running out,
   * it never falls ill from being left, and it tidies up overnight. Tamagotchi:
   * the classic rules. Left out, the classic rules apply.
   */
  style?: CareStyle;
}

export type CareStyle = 'cozy' | 'tamagotchi';

/** In Cozy, no need falls below this on its own: a little peckish, never miserable. */
export const COZY_FLOOR = 0.3;

const cozy = (schedule: Schedule) => schedule.style === 'cozy';

export type PetEventKind =
  | 'hatched'
  | 'tidied'
  | 'good-day'
  | 'grew'
  | 'fell-asleep'
  | 'woke'
  | 'hungry'
  | 'tired'
  | 'bored'
  | 'grubby'
  | 'mess'
  | 'unwell'
  | 'recovered'
  | 'back-from-sitter';

export interface PetEvent {
  kind: PetEventKind;
  at: number;
  /** For `grew`: the new stage. */
  stage?: Stage;
}

export interface Simulated {
  pet: Pet;
  events: PetEvent[];
}

/** A need below this is low: the face changes, and a reminder may be due. */
export const LOW = 0.25;
/** Below this, it counts towards getting unwell. */
export const EMPTY = 0.2;
/** Unwell below this Health, well again above RECOVERED. */
export const UNWELL = 0.35;
export const RECOVERED = 0.6;
/** Forward jumps of the clock count for at most this long. */
export const MAX_GAP = 14 * DAY;
export const SPROUT_DAYS = 3;
export const GROWN_DAYS = 10;
/** How long until a meal becomes a mess. */
export const DIGEST = 2 * HOUR;
export const MAX_MESSES = 3;
export const MESS_TIDINESS = 0.2;

/** Hours for each need to go from full to empty while awake, before traits and Gentle mode. */
const AWAKE_HOURS: Needs = { fullness: 9, energy: 16, mood: 12, tidiness: 40 };
/** While asleep. Energy refills (negative hours) in eight; mood holds. */
const ASLEEP_HOURS: Needs = { fullness: 18, energy: -8, mood: Infinity, tidiness: 80 };
const HEALTH_FALL_HOURS = 6;
const HEALTH_RISE_HOURS = 12;

/** How each trait changes how fast a need falls. */
const TRAIT_RATES: Record<Trait, Partial<Needs>> = {
  greedy: { fullness: 1.2 },
  sleepy: { energy: 1.2 },
  playful: { mood: 1.2 },
  tidy: { tidiness: 0.8 },
  shy: { mood: 0.9 },
  chatty: { mood: 1.1 },
};

export function newPet(id: string, name: string, now: number, traits: Trait[], coat?: CoatId): Pet {
  return {
    id,
    name,
    ...(coat ? { coat } : {}),
    createdAt: now,
    hatchedAt: null,
    warmth: 0,
    stage: 'seedpod',
    form: null,
    traits,
    needs: { fullness: 0.8, energy: 0.9, mood: 0.8, tidiness: 1 },
    health: 1,
    bond: 0,
    unwell: false,
    asleep: false,
    sleepOverride: null,
    messes: 0,
    messAt: null,
    sluggishUntil: null,
    treats: [],
    awayUntil: null,
    care: { attention: 0, foods: [], rest: 0, neglect: 0 },
    goodSince: null,
    goodDayAt: null,
    asOf: now,
  };
}

/** Two different traits, from a random source (Math.random in the app, fixed in tests). */
export function rollTraits(random: () => number = Math.random): Trait[] {
  const first = TRAITS[Math.floor(random() * TRAITS.length)] ?? 'playful';
  const rest = TRAITS.filter((t) => t !== first);
  const second = rest[Math.floor(random() * rest.length)] ?? 'chatty';
  return [first, second];
}

// ── The sleep schedule ─────────────────────────────────────────

/** Whether `t` falls between bedtime and wake time, in the phone's local time. */
export function isNight(t: number, schedule: Schedule): boolean {
  const d = new Date(t);
  const now = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  const bed = clockMinutes(schedule.bedtime);
  const wake = clockMinutes(schedule.wake);
  return bed > wake ? now >= bed || now < wake : now >= bed && now < wake;
}

/** The next bedtime or wake time strictly after `t`. */
export function nextBoundary(t: number, schedule: Schedule): number {
  let best = Infinity;
  const base = new Date(t);
  for (const day of [0, 1]) {
    for (const clock of [schedule.bedtime, schedule.wake]) {
      const minutes = clockMinutes(clock);
      const at = new Date(base.getFullYear(), base.getMonth(), base.getDate() + day, Math.floor(minutes / 60), minutes % 60).getTime();
      if (at > t && at < best) best = at;
    }
  }
  return best;
}

/** Whether the pet is asleep at `t`: the override while it holds, otherwise the schedule. */
export function asleepAt(pet: Pet, t: number, schedule: Schedule): boolean {
  if (pet.stage === 'seedpod') return false;
  if (pet.sleepOverride && t < pet.sleepOverride.until) return pet.sleepOverride.asleep;
  return isNight(t, schedule);
}

// ── Rates ──────────────────────────────────────────────────────

/** Change per millisecond for each need, Health and the care tally, given the state at the start of a segment. */
function rates(pet: Pet, asleep: boolean, schedule: Schedule, t: number): { needs: Needs; health: number } {
  const hours = asleep ? ASLEEP_HOURS : AWAKE_HOURS;
  const gentle = schedule.gentle ? 0.5 : 1;
  const needs = {} as Needs;
  for (const need of NEEDS) {
    let factor = gentle;
    for (const trait of pet.traits) factor *= TRAIT_RATES[trait][need] ?? 1;
    // Mood falls faster while any other need is low.
    if (need === 'mood' && !asleep && NEEDS.some((n) => n !== 'mood' && pet.needs[n] < LOW)) factor *= 1.6;
    const h = hours[need];
    needs[need] = h === Infinity ? 0 : -(factor / (h * HOUR));
  }
  // Sluggish after too many treats: energy drains faster while awake.
  if (!asleep && pet.sluggishUntil && t < pet.sluggishUntil) needs.energy *= 1.5;
  // A need already at its limit stays there. In Cozy the lower limit is the floor.
  const floor = cozy(schedule) ? COZY_FLOOR : 0;
  for (const need of NEEDS) {
    if ((pet.needs[need] <= floor + 1e-9 && needs[need] < 0) || (pet.needs[need] >= 1 && needs[need] > 0)) needs[need] = 0;
  }
  const empties = NEEDS.filter((n) => pet.needs[n] < EMPTY).length;
  // In Cozy, being left never makes it ill: Health only mends.
  let health = empties >= 2 && !cozy(schedule) ? -1 / (HEALTH_FALL_HOURS * HOUR) : 1 / (HEALTH_RISE_HOURS * HOUR);
  if ((pet.health <= 0 && health < 0) || (pet.health >= 1 && health > 0)) health = 0;
  return { needs, health };
}

/** The time from `value` moving at `rate` until it reaches `target`, or Infinity. */
function timeTo(value: number, rate: number, target: number): number {
  if (rate < 0 && value > target) return (value - target) / -rate;
  if (rate > 0 && value < target) return (target - value) / rate;
  return Infinity;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// ── Simulation ─────────────────────────────────────────────────

/**
 * The pet as it is at `to`, and what happened on the way. A clock that went
 * backwards changes nothing; a forward jump counts for at most two weeks.
 */
export function simulate(start: Pet, to: number, schedule: Schedule): Simulated {
  const events: PetEvent[] = [];
  if (!(to > start.asOf)) return { pet: { ...start, asOf: Math.max(start.asOf, Number.isFinite(to) ? to : start.asOf) }, events };

  const pet: Pet = structuredClone(start);
  // Time past the cap passes as if with a sitter.
  let t = pet.asOf;
  const limit = Math.min(to, t + MAX_GAP);

  // A seedpod doesn't need anything yet.
  if (pet.stage === 'seedpod') return { pet: { ...pet, asOf: to }, events };

  let guard = 0;
  while (t < limit && guard++ < 10_000) {
    // With a sitter: needs hold, until the sitter hands it back.
    if (pet.awayUntil && t < pet.awayUntil) {
      const back = Math.min(pet.awayUntil, limit);
      t = back;
      if (back >= pet.awayUntil) {
        pet.awayUntil = null;
        pet.sleepOverride = null;
        events.push({ kind: 'back-from-sitter', at: back });
      }
      continue;
    }

    const asleep = asleepAt(pet, t, schedule);
    if (asleep !== pet.asleep) {
      pet.asleep = asleep;
      events.push({ kind: asleep ? 'fell-asleep' : 'woke', at: t });
      // In Cozy it tidies up after itself overnight.
      if (!asleep && cozy(schedule) && pet.messes > 0) {
        pet.messes = 0;
        pet.messAt = null;
        events.push({ kind: 'tidied', at: t });
      }
    }

    // The segment ends at the first moment a rate could change.
    let end = limit;
    const boundary = nextBoundary(t, schedule);
    end = Math.min(end, boundary);
    if (pet.sleepOverride && t < pet.sleepOverride.until) end = Math.min(end, pet.sleepOverride.until);
    if (pet.messAt !== null && pet.messAt > t) end = Math.min(end, pet.messAt);
    if (pet.sluggishUntil !== null && pet.sluggishUntil > t) end = Math.min(end, pet.sluggishUntil);
    if (pet.awayUntil && pet.awayUntil > t) end = Math.min(end, pet.awayUntil);
    for (const at of growthMoments(pet)) if (at > t) end = Math.min(end, at);

    const r = rates(pet, asleep, schedule, t);
    for (const need of NEEDS) {
      for (const target of cozy(schedule) ? [COZY_FLOOR] : [LOW, EMPTY, 0]) end = Math.min(end, t + timeTo(pet.needs[need], r.needs[need], target));
      if (r.needs[need] > 0) end = Math.min(end, t + timeTo(pet.needs[need], r.needs[need], 1));
    }
    for (const target of [UNWELL, RECOVERED, 0, 1]) end = Math.min(end, t + timeTo(pet.health, r.health, target));
    // Never a zero-length step: move at least a millisecond.
    end = Math.max(end, t + 1);
    if (end > limit) end = limit;

    const dt = end - t;
    const before = { ...pet.needs };
    for (const need of NEEDS) pet.needs[need] = clamp01(pet.needs[need] + r.needs[need] * dt);
    pet.health = clamp01(pet.health + r.health * dt);
    if (pet.stage === 'nookling') {
      if (asleep && isNight(t, schedule)) pet.care.rest += dt / HOUR;
      if (NEEDS.some((n) => before[n] < EMPTY)) pet.care.neglect += dt / HOUR;
    }
    t = end;

    // What changed at the end of the segment.
    for (const [need, kind] of [
      ['fullness', 'hungry'],
      ['energy', 'tired'],
      ['mood', 'bored'],
      ['tidiness', 'grubby'],
    ] as const) {
      if (before[need] >= LOW && pet.needs[need] < LOW + 1e-9 && r.needs[need] < 0) {
        pet.needs[need] = Math.min(pet.needs[need], LOW - 1e-9);
        events.push({ kind, at: t });
      }
    }
    if (!pet.unwell && pet.health <= UNWELL + 1e-9 && r.health < 0) {
      pet.unwell = true;
      events.push({ kind: 'unwell', at: t });
    } else if (pet.unwell && pet.health >= RECOVERED - 1e-9 && r.health > 0) {
      pet.unwell = false;
      events.push({ kind: 'recovered', at: t });
    }
    if (pet.messAt !== null && t >= pet.messAt) {
      pet.messAt = null;
      if (pet.messes < MAX_MESSES) {
        pet.messes += 1;
        pet.needs.tidiness = clamp01(pet.needs.tidiness - MESS_TIDINESS);
        if (cozy(schedule)) pet.needs.tidiness = Math.max(pet.needs.tidiness, COZY_FLOOR);
        events.push({ kind: 'mess', at: t });
      }
    }
    if (pet.sluggishUntil !== null && t >= pet.sluggishUntil) pet.sluggishUntil = null;
    if (pet.sleepOverride && t >= pet.sleepOverride.until) pet.sleepOverride = null;
    for (const event of grow(pet, t)) events.push(event);
  }

  pet.asleep = asleepAt(pet, to, schedule);
  pet.treats = pet.treats.filter((at) => at > to - 2 * HOUR);
  pet.asOf = to;
  return { pet, events };
}

/** When the pet moves to its next stage. */
function growthMoments(pet: Pet): number[] {
  if (pet.hatchedAt === null) return [];
  if (pet.stage === 'sprout') return [pet.hatchedAt + SPROUT_DAYS * DAY];
  if (pet.stage === 'nookling') return [pet.hatchedAt + GROWN_DAYS * DAY];
  return [];
}

/** Moves the pet on a stage if it is time. The grown form comes from the care tally. */
function grow(pet: Pet, t: number): PetEvent[] {
  const [at] = growthMoments(pet);
  if (at === undefined || t < at) return [];
  if (pet.stage === 'sprout') pet.stage = 'nookling';
  else if (pet.stage === 'nookling') {
    pet.stage = 'grown';
    pet.form = formFrom(pet.care);
  }
  return [{ kind: 'grew', at: t, stage: pet.stage }];
}

/**
 * The grown form, from how the pet was cared for in days 3 to 10. The kind
 * of care that stands out wins; patchy care, or none standing out, makes a
 * Scamp, which is every bit as happy.
 */
export function formFrom(care: CareTally): Form {
  // Each score is roughly "how much of a good week this was".
  const attention = care.attention / 70; // ten a day
  const variety = care.foods.length / 8;
  const rest = care.rest / 56; // eight nights of seven hours
  if (care.neglect > 24) return 'scamp';
  const scores: [Form, number][] = [
    ['lamplighter', attention],
    ['gardener', variety],
    ['dreamer', rest],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  const [best, second] = scores;
  if (!best || best[1] < 0.5 || (second && best[1] - second[1] < 0.05)) return 'scamp';
  return best[0];
}

// ── Care ───────────────────────────────────────────────────────
// Each takes the pet as it is now (already simulated to `now`) and returns
// the pet afterwards, or a reason it didn't happen.

export type Refusal = 'asleep' | 'full' | 'not-yet' | 'too-tired' | 'clean' | 'well' | 'seedpod' | 'away';
export type Cared = { ok: true; pet: Pet } | { ok: false; why: Refusal };

function touched(pet: Pet, bond = 0.01): Pet {
  const next = structuredClone(pet);
  next.bond = clamp01(next.bond + bond);
  if (next.stage === 'nookling') next.care.attention += 1;
  return next;
}

function basics(pet: Pet): Refusal | null {
  if (pet.stage === 'seedpod') return 'seedpod';
  if (pet.awayUntil) return 'away';
  return null;
}

export function feed(pet: Pet, food: Food, now: number, canHaveIt: boolean, style: CareStyle = 'tamagotchi'): Cared {
  const no = basics(pet);
  if (no) return { ok: false, why: no };
  if (pet.asleep) return { ok: false, why: 'asleep' };
  if (!canHaveIt) return { ok: false, why: 'not-yet' };
  if (pet.needs.fullness > 0.95) return { ok: false, why: 'full' };
  const next = structuredClone(pet);
  next.needs.fullness = clamp01(next.needs.fullness + food.fullness);
  const sluggish = next.sluggishUntil !== null && now < next.sluggishUntil;
  next.needs.mood = clamp01(next.needs.mood + (sluggish && food.kind === 'treat' ? 0 : food.mood));
  next.health = clamp01(next.health + food.health);
  if (food.kind === 'treat') {
    next.treats = [...next.treats.filter((at) => at > now - 2 * HOUR), now];
    if (next.treats.length > 3) next.sluggishUntil = now + HOUR;
  }
  if (food.kind === 'meal' || food.kind === 'fruit') {
    next.meals = (next.meals ?? 0) + 1;
    // In Cozy only every third meal makes a mess.
    if (style !== 'cozy' || next.meals % 3 === 0) next.messAt ??= now + DIGEST;
  }
  if (next.stage === 'nookling' && !next.care.foods.includes(food.id)) next.care.foods = [...next.care.foods, food.id];
  next.bond = clamp01(next.bond + 0.005);
  return { ok: true, pet: next };
}

/** A game. `score` 0 to 1 lifts Mood a little more. */
export function play(pet: Pet, score: number): Cared {
  const no = basics(pet);
  if (no) return { ok: false, why: no };
  if (pet.asleep) return { ok: false, why: 'asleep' };
  if (pet.needs.energy < 0.1) return { ok: false, why: 'too-tired' };
  const next = touched(pet, 0.02);
  next.needs.mood = clamp01(next.needs.mood + 0.18 + 0.1 * clamp01(score));
  next.needs.energy = clamp01(next.needs.energy - 0.12);
  next.needs.fullness = clamp01(next.needs.fullness - 0.03);
  return { ok: true, pet: next };
}

/** A stroke, a boop or a cuddle: a little Mood and Bond. Works while it sleeps, gently. */
export function stroke(pet: Pet, kind: 'boop' | 'stroke' | 'cuddle'): Cared {
  const no = basics(pet);
  if (no) return { ok: false, why: no };
  const lift = { boop: 0.01, stroke: 0.03, cuddle: 0.05 }[kind];
  const next = touched(pet, kind === 'boop' ? 0.003 : 0.01);
  next.needs.mood = clamp01(next.needs.mood + (pet.asleep ? lift / 2 : lift));
  return { ok: true, pet: next };
}

export function clean(pet: Pet): Cared {
  const no = basics(pet);
  if (no) return { ok: false, why: no };
  if (pet.needs.tidiness > 0.97 && pet.messes === 0) return { ok: false, why: 'clean' };
  const next = touched(pet);
  next.needs.tidiness = 1;
  next.messes = 0;
  next.needs.mood = clamp01(next.needs.mood + 0.03);
  return { ok: true, pet: next };
}

export function medicine(pet: Pet): Cared {
  const no = basics(pet);
  if (no) return { ok: false, why: no };
  if (!pet.unwell) return { ok: false, why: 'well' };
  const next = touched(pet);
  next.health = clamp01(next.health + 0.35);
  if (next.health >= RECOVERED) next.unwell = false;
  next.needs.mood = clamp01(next.needs.mood - 0.03);
  return { ok: true, pet: next };
}

/** Lights off (to bed now) or on (awake now), until the next bedtime or wake time. */
export function lights(pet: Pet, now: number, schedule: Schedule): Cared {
  const no = basics(pet);
  if (no) return { ok: false, why: no };
  const next = structuredClone(pet);
  const asleep = !pet.asleep;
  const until = nextBoundary(now, schedule);
  // Turning things back to what the schedule says ends the override.
  next.sleepOverride = asleep === isNight(now, schedule) ? null : { asleep, until };
  next.asleep = asleep;
  return { ok: true, pet: next };
}

/** Taps on the seedpod warm it; it hatches at full warmth. */
export function warm(pet: Pet, now: number): { pet: Pet; hatched: boolean } {
  if (pet.stage !== 'seedpod') return { pet, hatched: false };
  const next = structuredClone(pet);
  next.warmth = clamp01(next.warmth + 0.05);
  if (next.warmth < 1) return { pet: next, hatched: false };
  next.stage = 'sprout';
  next.hatchedAt = now;
  next.asOf = now;
  return { pet: next, hatched: true };
}

/** Leave it with a sitter for up to two weeks. */
export function goAway(pet: Pet, now: number, days: number): Pet {
  return { ...structuredClone(pet), awayUntil: now + Math.min(14, Math.max(1, Math.round(days))) * DAY };
}

export function comeBack(pet: Pet): Pet {
  return { ...structuredClone(pet), awayUntil: null };
}

// ── Reading the state ─────────────────────────────────────────

/** The need that matters most right now, if any is low. */
export function lowestNeed(pet: Pet): Need | null {
  let worst: Need | null = null;
  for (const need of NEEDS) if (pet.needs[need] < LOW && (worst === null || pet.needs[need] < pet.needs[worst])) worst = need;
  return worst;
}

/** The word for a need's level, as a message key suffix: full, fine, low or empty. */
export function level(value: number): 'full' | 'fine' | 'low' | 'empty' {
  if (value >= 0.75) return 'full';
  if (value >= LOW) return 'fine';
  if (value >= 0.1) return 'low';
  return 'empty';
}
