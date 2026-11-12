// The pet's world, on screen: its finds, the moments you catch it in, and
// (later) the nook, garden and wardrobe. Foraging only counts time the app
// is out of sight: while you're here, it stays with you.

import { db } from '../data/db';
import type { Game } from '../domain/games';
import { recordGame, type Played } from '../world/arcade';
import { LEARN_AFTER, teach, type Trick } from '../world/tricks';
import { place, type DecorId } from '../world/decor';
import { harvest, plant, type SeedId } from '../world/garden';
import { pickTreasure, seasonAt } from '../world/treasures';
import { collectSeason, wear, type ClothesId } from '../world/wardrobe';
import { maybeVisit, stillHere } from '../world/visitors';
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
    void this.update((w) => remember(stayed(this.visitors(forage(this.season(w, now), pet, now, schedule()), pet.id, now, gone), now), caught, now));
  }

  /** A visitor may have dropped by; one who has stayed long enough goes home. */
  private visitors(w: World, petId: string, now: number, gone: number): World {
    if (w.visit && !stillHere(w.visit, now)) w = { ...w, visit: null };
    if (w.visit) return w;
    const visit = maybeVisit(petId, now, gone, w.lastVisit);
    if (!visit) return w;
    const met = w.visitors[visit.id] ?? { met: 0, favours: 0 };
    return { ...w, visit, lastVisit: now, visitors: { ...w.visitors, [visit.id]: { ...met, met: met.met + 1 } } };
  }

  /** Did them the favour: they leave a little thank-you find. */
  async favour(now = Date.now()): Promise<void> {
    const v = this.world.visit;
    if (!v) return;
    const met = this.world.visitors[v.id] ?? { met: 1, favours: 0 };
    const thanks = { id: `${v.id}:${now}`, treasureId: pickTreasure(now, Math.random()).id, at: now };
    await this.save({ ...this.world, visit: null, waiting: [...this.world.waiting, thanks], visitors: { ...this.world.visitors, [v.id]: { ...met, favours: met.favours + 1 } } });
  }

  /** Wave them off. */
  async farewell(): Promise<void> {
    await this.save({ ...this.world, visit: null });
  }

  /** Seasonal clothes in season join the wardrobe. */
  private season(w: World, now: number): World {
    const wardrobe = collectSeason(w.wardrobe, seasonAt(now), now);
    return wardrobe === w.wardrobe ? w : { ...w, wardrobe };
  }

  /** Puts a thing out in the nook, moves it, or (with null) puts it away. */
  async arrange(id: DecorId, at: { x: number; y: number } | null): Promise<void> {
    const decor = { ...this.world.decor };
    if (at) decor[id] = place(at.x, at.y);
    else delete decor[id];
    await this.save({ ...this.world, decor });
  }

  async plant(plot: number, seed: SeedId, now = Date.now()): Promise<void> {
    await this.save({ ...this.world, garden: plant(this.world.garden, plot, seed, now) });
  }

  /** Picks a ripe plant: the seed, and whether that was its first harvest. */
  async harvest(plot: number, now = Date.now()): Promise<{ seed: SeedId; first: boolean } | null> {
    const { garden, seed } = harvest(this.world.garden, plot, now);
    if (!seed) return null;
    const first = !this.world.garden.harvested[seed];
    await this.save({ ...this.world, garden });
    return { seed, first };
  }

  async wear(id: ClothesId): Promise<void> {
    await this.save({ ...this.world, wardrobe: wear(this.world.wardrobe, id) });
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

  /** A game finished: best scores, and the game of the day's extra. */
  async played(game: Game, score: number, now = Date.now()): Promise<Played> {
    const result = recordGame(this.world.arcade, game, score, now);
    await this.save({ ...this.world, arcade: result.arcade });
    return result;
  }

  /** One lesson on a trick. True when that lesson was the one it learned it on. */
  async lesson(id: Trick['id']): Promise<boolean> {
    const before = this.world.tricks[id] ?? 0;
    const tricks = teach(this.world.tricks, id);
    await this.save({ ...this.world, tricks });
    return (tricks[id] ?? 0) > before && tricks[id] === LEARN_AFTER;
  }

  /** Remembers your reply to one of its questions. */
  async answer(question: string, reply: number): Promise<void> {
    await this.save({ ...this.world, chat: { ...this.world.chat, [question]: reply } });
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
