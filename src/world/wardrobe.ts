// The wardrobe: a hat, something round the neck, something on the nose.
// Some are earned; seasonal ones turn up in their season and, once found,
// stay in the wardrobe.

import { unlocked, type Unlock, type Yardstick } from './progress';
import type { Season } from './treasures';

export type Slot = 'hat' | 'neck' | 'eyes';
export type ClothesId =
  | 'beret'
  | 'flower-crown'
  | 'sun-hat'
  | 'acorn-cap'
  | 'woolly-hat'
  | 'party-hat'
  | 'bow'
  | 'scarf'
  | 'bandana'
  | 'bell'
  | 'round-glasses'
  | 'sunglasses'
  | 'monocle';

export interface Clothes {
  id: ClothesId;
  slot: Slot;
  unlock?: Unlock;
  season?: Season;
}

export const CLOTHES: readonly Clothes[] = [
  { id: 'beret', slot: 'hat' },
  { id: 'flower-crown', slot: 'hat', season: 'spring' },
  { id: 'sun-hat', slot: 'hat', season: 'summer' },
  { id: 'acorn-cap', slot: 'hat', season: 'autumn' },
  { id: 'woolly-hat', slot: 'hat', season: 'winter' },
  { id: 'party-hat', slot: 'hat', unlock: { by: 'games', n: 12 } },
  { id: 'bow', slot: 'neck' },
  { id: 'scarf', slot: 'neck', season: 'winter' },
  { id: 'bandana', slot: 'neck', unlock: { by: 'treasures', n: 5 } },
  { id: 'bell', slot: 'neck', unlock: { by: 'moments', n: 5 } },
  { id: 'round-glasses', slot: 'eyes', unlock: { by: 'chat', n: 3 } },
  { id: 'sunglasses', slot: 'eyes', season: 'summer' },
  { id: 'monocle', slot: 'eyes', unlock: { by: 'treasures', n: 15 } },
];
export const SLOTS: readonly Slot[] = ['hat', 'neck', 'eyes'];

export type Outfit = Partial<Record<Slot, ClothesId>>;
export interface Wardrobe {
  wearing: Outfit;
  /** Seasonal things found in their season, kept for good. */
  kept: Partial<Record<ClothesId, number>>;
}

export function newWardrobe(): Wardrobe {
  return { wearing: {}, kept: {} };
}

export function clothesById(id: string): Clothes | undefined {
  return CLOTHES.find((c) => c.id === id);
}

/** Puts it on, or takes it off if it's already on. */
export function wear(wardrobe: Wardrobe, id: ClothesId): Wardrobe {
  const item = clothesById(id);
  if (!item) return wardrobe;
  const wearing = { ...wardrobe.wearing };
  if (wearing[item.slot] === id) delete wearing[item.slot];
  else wearing[item.slot] = id;
  return { ...wardrobe, wearing };
}

/** Seasonal things in season join the wardrobe for good. */
export function collectSeason(wardrobe: Wardrobe, season: Season, now: number): Wardrobe {
  const fresh = CLOTHES.filter((c) => c.season === season && !wardrobe.kept[c.id]);
  if (!fresh.length) return wardrobe;
  return { ...wardrobe, kept: { ...wardrobe.kept, ...Object.fromEntries(fresh.map((c) => [c.id, now])) } };
}

/** Whether it can wear this now: always, earned, kept from its season, or in season. */
export function available(item: Clothes, wardrobe: Wardrobe, counts: Record<Yardstick, number>, season: Season): boolean {
  if (item.season) return item.season === season || !!wardrobe.kept[item.id];
  return !item.unlock || unlocked(item.unlock, counts);
}
