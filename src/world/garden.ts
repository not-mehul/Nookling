// The garden: plant a seed, it grows in real time, harvest it for a new food
// in the Pantry. Nothing wilts: a ripe plant waits for you as long as it takes.

import { HOUR } from '../domain/pet';

export type SeedId = 'mint' | 'strawberry' | 'pea' | 'carrot' | 'pumpkin';
export interface Seed {
  id: SeedId;
  /** The garden food it gives. */
  food: string;
  growMs: number;
  /** Harvests (of anything) before this seed is in the packet. */
  after: number;
}

export const SEEDS: readonly Seed[] = [
  { id: 'mint', food: 'mint-sprig', growMs: 2 * HOUR, after: 0 },
  { id: 'strawberry', food: 'strawberry', growMs: 5 * HOUR, after: 0 },
  { id: 'pea', food: 'pea-pod', growMs: 4 * HOUR, after: 1 },
  { id: 'carrot', food: 'baby-carrot', growMs: 8 * HOUR, after: 3 },
  { id: 'pumpkin', food: 'little-pumpkin', growMs: 12 * HOUR, after: 6 },
];
export const PLOTS = 3;

export interface Plot {
  seed: SeedId;
  plantedAt: number;
}
export interface Garden {
  plots: (Plot | null)[];
  /** Harvests per seed. */
  harvested: Partial<Record<SeedId, number>>;
}

export type Growth = 'seed' | 'sprout' | 'bud' | 'ripe';

export function newGarden(): Garden {
  return { plots: Array.from({ length: PLOTS }, () => null), harvested: {} };
}

export function seedById(id: string): Seed | undefined {
  return SEEDS.find((s) => s.id === id);
}

export function growth(plot: Plot, now: number): { stage: Growth; ripeAt: number; progress: number } {
  const seed = seedById(plot.seed);
  const ripeAt = plot.plantedAt + (seed?.growMs ?? HOUR);
  const progress = Math.min(1, Math.max(0, (now - plot.plantedAt) / (ripeAt - plot.plantedAt)));
  const stage: Growth = progress >= 1 ? 'ripe' : progress >= 0.6 ? 'bud' : progress >= 0.2 ? 'sprout' : 'seed';
  return { stage, ripeAt, progress };
}

export function seedsFor(garden: Garden): Seed[] {
  const total = Object.values(garden.harvested).reduce<number>((a, b) => a + (b ?? 0), 0);
  return SEEDS.filter((s) => total >= s.after);
}

export function plant(garden: Garden, index: number, seed: SeedId, now: number): Garden {
  if (garden.plots[index] || !seedsFor(garden).some((s) => s.id === seed)) return garden;
  const plots = [...garden.plots];
  plots[index] = { seed, plantedAt: now };
  return { ...garden, plots };
}

/** Picks a ripe plant. Returns the garden after, and the seed picked (or null if it wasn't ripe). */
export function harvest(garden: Garden, index: number, now: number): { garden: Garden; seed: SeedId | null } {
  const plot = garden.plots[index];
  if (!plot || growth(plot, now).stage !== 'ripe') return { garden, seed: null };
  const plots = [...garden.plots];
  plots[index] = null;
  return { garden: { plots, harvested: { ...garden.harvested, [plot.seed]: (garden.harvested[plot.seed] ?? 0) + 1 } }, seed: plot.seed };
}

/** The garden foods it has grown at least once: these join the Pantry for good. */
export function grownFoods(garden: Garden): string[] {
  return SEEDS.filter((s) => (garden.harvested[s.id] ?? 0) > 0).map((s) => s.food);
}
