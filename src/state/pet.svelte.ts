// The pet on screen. Loads it, keeps it current (simulating on resume and
// every half minute while open), applies care, and saves after every change.
// The rules themselves are in src/domain/pet.ts.

import { db, type LogEntry } from '../data/db';
import { canHave, type Food } from '../domain/foods';
import {
  clean,
  comeBack,
  feed,
  goAway,
  lights,
  medicine,
  newPet,
  play,
  rollTraits,
  simulate,
  stroke,
  warm,
  type Cared,
  type Pet,
  type PetEvent,
  type Refusal,
  type Schedule,
} from '../domain/pet';
import { settings } from './settings.svelte';

const TICK_MS = 30_000;
const LOGGED: ReadonlySet<string> = new Set(['hatched', 'grew', 'fell-asleep', 'woke', 'hungry', 'tired', 'bored', 'grubby', 'mess', 'unwell', 'recovered', 'back-from-sitter']);

function schedule(): Schedule {
  const { bedtime, wake, gentle } = settings.current;
  return { bedtime, wake, gentle };
}

function uid(): string {
  return crypto.randomUUID();
}

export type CareResult = { ok: true } | { ok: false; why: Refusal };

class PetState {
  pet = $state.raw<Pet | null>(null);
  /** The newest care log entries, newest first. */
  log = $state.raw<LogEntry[]>([]);
  ready = $state(false);
  /** What happened while the app was closed, for the welcome-back line. Cleared once read. */
  away = $state.raw<PetEvent[]>([]);
  /** Fires for every event as it happens, so the Nook can react. */
  private listeners = new Set<(events: PetEvent[]) => void>();
  private timer: ReturnType<typeof setInterval> | undefined;

  async init(now = Date.now()): Promise<void> {
    const stored = await db.pets.toCollection().first();
    if (stored) {
      this.pet = stored;
      await this.refresh(now, true);
    }
    await this.loadLog();
    this.ready = true;
    this.timer ??= setInterval(() => void this.refresh(), TICK_MS);
  }

  /** Starts a new seedpod. */
  async adopt(name: string, now = Date.now()): Promise<void> {
    const pet = newPet(uid(), name.trim().slice(0, 24) || 'Nookling', now, rollTraits());
    await this.save(pet, [{ kind: 'named', at: now, detail: pet.name }]);
  }

  /** Brings the pet up to `now`. `quiet` keeps what happened for the welcome-back line instead of announcing it. */
  async refresh(now = Date.now(), quiet = false): Promise<void> {
    const pet = this.pet;
    if (!pet) return;
    const { pet: next, events } = simulate(pet, now, schedule());
    if (quiet && events.length) this.away = events;
    await this.save(
      next,
      events.filter((e) => LOGGED.has(e.kind)).map((e) => ({ kind: e.kind, at: e.at, detail: e.stage })),
    );
    if (!quiet && events.length) for (const fn of this.listeners) fn(events);
  }

  onEvents(fn: (events: PetEvent[]) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  takeAway(): PetEvent[] {
    const events = this.away;
    this.away = [];
    return events;
  }

  // ── Care: each simulates to now first, so it acts on the pet as it is.

  private async apply(change: (pet: Pet, now: number) => Cared, log?: { kind: string; detail?: string }): Promise<CareResult> {
    const now = Date.now();
    await this.refresh(now);
    const pet = this.pet;
    if (!pet) return { ok: false, why: 'seedpod' };
    const result = change(pet, now);
    if (!result.ok) return result;
    await this.save({ ...result.pet, asOf: now }, log ? [{ ...log, at: now }] : []);
    return { ok: true };
  }

  feed(food: Food): Promise<CareResult> {
    return this.apply((pet, now) => feed(pet, food, now, canHave(food, pet.stage)), { kind: 'fed', detail: food.id });
  }

  play(game: string, score: number): Promise<CareResult> {
    return this.apply((pet) => play(pet, score), { kind: 'played', detail: game });
  }

  clean(): Promise<CareResult> {
    return this.apply((pet) => clean(pet), { kind: 'cleaned' });
  }

  medicine(): Promise<CareResult> {
    return this.apply((pet) => medicine(pet), { kind: 'medicine' });
  }

  /** Strokes and boops are frequent: only cuddles go in the log. */
  stroke(kind: 'boop' | 'stroke' | 'cuddle'): Promise<CareResult> {
    return this.apply((pet) => stroke(pet, kind), kind === 'cuddle' ? { kind: 'cuddled' } : undefined);
  }

  lights(): Promise<CareResult> {
    const asleep = this.pet?.asleep ?? false;
    return this.apply((pet, now) => lights(pet, now, schedule()), { kind: asleep ? 'lights-on' : 'lights-off' });
  }

  /** A tap on the seedpod. True when it hatched. */
  async warm(): Promise<boolean> {
    const pet = this.pet;
    if (!pet) return false;
    const now = Date.now();
    const { pet: next, hatched } = warm(pet, now);
    await this.save(next, hatched ? [{ kind: 'hatched', at: now }] : []);
    return hatched;
  }

  async goAway(days: number): Promise<void> {
    const now = Date.now();
    await this.refresh(now);
    if (this.pet) await this.save(goAway(this.pet, now, days), [{ kind: 'away', at: now, detail: String(days) }]);
  }

  async comeBack(): Promise<void> {
    await this.refresh();
    if (this.pet) await this.save(comeBack(this.pet), [{ kind: 'back-from-sitter', at: Date.now() }]);
  }

  async rename(name: string): Promise<void> {
    const pet = this.pet;
    const clean = name.trim().slice(0, 24);
    if (!pet || !clean || clean === pet.name) return;
    await this.save({ ...pet, name: clean }, [{ kind: 'named', at: Date.now(), detail: clean }]);
  }

  private async save(pet: Pet, entries: Omit<LogEntry, 'id' | 'petId'>[]): Promise<void> {
    this.pet = pet;
    const rows = entries.map((e) => ({ ...e, id: uid(), petId: pet.id }));
    await db.transaction('rw', db.pets, db.log, async () => {
      await db.pets.put($state.snapshot(pet) as Pet);
      if (rows.length) await db.log.bulkAdd(rows);
    });
    if (rows.length) await this.loadLog();
  }

  private async loadLog(): Promise<void> {
    this.log = await db.log.orderBy('at').reverse().limit(200).toArray();
  }

  /** For tests: forget everything in memory. */
  reset(): void {
    clearInterval(this.timer);
    this.timer = undefined;
    this.pet = null;
    this.log = [];
    this.ready = false;
  }
}

export const petState = new PetState();
