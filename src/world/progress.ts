// What it has been up to, counted: the yardsticks that unlock decorations
// and clothes. Earned by play and finds, never bought.

import { DAY, type Pet } from '../domain/pet';
import { known } from './tricks';
import type { World } from './world';

export type Yardstick = 'treasures' | 'games' | 'tricks' | 'chat' | 'moments' | 'days' | 'harvests';

export interface Unlock {
  by: Yardstick;
  /** How many it takes; 0 means from the start. */
  n: number;
}

export function tally(world: World, pet: Pet | null, now: number): Record<Yardstick, number> {
  const sum = (r: Record<string, number | undefined>) => Object.values(r).reduce<number>((a, b) => a + (b ?? 0), 0);
  return {
    treasures: Object.keys(world.treasures).length,
    games: sum(world.arcade.played),
    tricks: known(world.tricks).length,
    chat: Object.keys(world.chat).length,
    moments: Object.keys(world.moments).length,
    days: pet?.hatchedAt ? Math.floor((now - pet.hatchedAt) / DAY) : 0,
    harvests: sum(world.garden.harvested),
  };
}

export function unlocked(unlock: Unlock, counts: Record<Yardstick, number>): boolean {
  return counts[unlock.by] >= unlock.n;
}
