// The pet's world, on screen: its finds, the moments you catch it in, and
// (later) the nook, garden and wardrobe. Foraging only counts time the app
// is out of sight: while you're here, it stays with you.

import { db } from '../data/db';
import { pickMoment, type Moment } from '../world/moments';
import { forage, newWorld, normaliseWorld, receive, stayed, MOMENT_AFTER, type Find, type World } from '../world/world';
import { petState, schedule } from './pet.svelte';

const TICK_MS = 30_000;

/** A moment goes in the scrapbook the first time you catch it. */
function remember(w: World, id: string | null, now: number): World {
  return id && !w.moments[id] ? { ...w, moments: { ...w.moments, [id]: now } } : w;
}

class WorldState {
  world = $state.raw<World>(newWorld(Date.now()));
  ready = $state(false);
  /** The little moment it was caught in on your return, until it notices you. */
  moment = $state.raw<Moment | null>(null);
  private timer: ReturnType<typeof setInterval> | undefined;
  private listening = false;

  async init(now = Date.now()): Promise<void> {
    const stored = await db.world.get('world');
    this.world = stored ? normaliseWorld(stored, now) : newWorld(now);
    this.ready = true;
    this.back(now);
    this.timer ??= setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) void this.update((w) => stayed(w, Date.now()));
    }, TICK_MS);
    if (!this.listening && typeof document !== 'undefined') {
      this.listening = true;
      document.addEventListener('visibilitychange', () => (document.hidden ? this.away() : this.back()));
    }
  }

  /** Coming back: count what it found, and catch it at something if it's been a while. */
  back(now = Date.now()): void {
    const pet = petState.pet;
    if (!pet) return void this.update((w) => stayed(w, now));
    const gone = now - this.world.lastSeen;
    let caught: string | null = null;
    if (gone >= MOMENT_AFTER && pet.stage !== 'seedpod' && !pet.asleep && !pet.awayUntil) {
      this.moment = pickMoment(pet.traits, now, Math.random, this.moment?.id);
      caught = this.moment.id;
    }
    void this.update((w) => remember(stayed(forage(w, pet, now, schedule()), now), caught, now));
  }

  /** Leaving: it starts its wanders from here. */
  away(now = Date.now()): void {
    void this.update((w) => stayed(w, now));
  }

  /** A moment while you watch, now and then. */
  catchMoment(now = Date.now()): void {
    const pet = petState.pet;
    if (!pet) return;
    const m = pickMoment(pet.traits, now, Math.random, this.moment?.id);
    this.moment = m;
    void this.update((w) => remember(w, m.id, now));
  }

  /** It noticed you: the moment ends. */
  noticed(): void {
    this.moment = null;
  }

  /** Opens the oldest find. */
  async receive(): Promise<{ find: Find; isNew: boolean } | null> {
    const { world, find, isNew } = receive(this.world);
    if (!find) return null;
    await this.save(world);
    return { find, isNew };
  }

  async update(change: (w: World) => World): Promise<void> {
    await this.save(change(this.world));
  }

  async save(world: World): Promise<void> {
    this.world = world;
    await db.world.put($state.snapshot(world) as World);
  }

  /** For tests and restores. */
  reset(world?: World): void {
    clearInterval(this.timer);
    this.timer = undefined;
    this.world = world ?? newWorld(Date.now());
    this.moment = null;
  }
}

export const worldState = new WorldState();
