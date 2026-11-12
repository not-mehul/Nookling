// What it brings back from its wanders: little found things for the Treasures
// book. Each is a shape (drawn in TreasureIcon.svelte) in a token colour.
// Rarity sets the odds; some only turn up in a season.

export type TreasureShape =
  | 'shell'
  | 'button'
  | 'leaf'
  | 'pebble'
  | 'key'
  | 'feather'
  | 'marble'
  | 'acorn'
  | 'clover'
  | 'cap'
  | 'ribbon'
  | 'star'
  | 'glass'
  | 'coin'
  | 'thimble'
  | 'flower'
  | 'snowflake'
  | 'egg';
/** The --pet-* token it is filled with. */
export type TreasureColour = 'berry' | 'leaf' | 'crust' | 'honey' | 'sage' | 'cream' | 'rust' | 'fur';
export type Rarity = 'common' | 'uncommon' | 'rare';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Treasure {
  id: string;
  name: string;
  shape: TreasureShape;
  colour: TreasureColour;
  rarity: Rarity;
  /** Only found in this season. */
  season?: Season;
  /** What it says when it hands it over. */
  note: string;
}

const T = (id: string, name: string, shape: TreasureShape, colour: TreasureColour, rarity: Rarity, note: string, season?: Season): Treasure => ({
  id,
  name,
  shape,
  colour,
  rarity,
  note,
  ...(season ? { season } : {}),
});

export const TREASURES: readonly Treasure[] = [
  T('round-pebble', 'Round pebble', 'pebble', 'sage', 'common', 'Perfectly round. Like someone it knows.'),
  T('flat-pebble', 'Skimming stone', 'pebble', 'cream', 'common', 'Flat enough to skip, if it had arms.'),
  T('brown-button', 'Coat button', 'button', 'crust', 'common', 'Four holes. Fell off something warm.'),
  T('red-button', 'Red button', 'button', 'berry', 'common', 'Shiny and very red.'),
  T('oak-leaf', 'Oak leaf', 'leaf', 'leaf', 'common', 'Still green at the edges.'),
  T('acorn', 'Acorn', 'acorn', 'crust', 'common', 'Hat and all.'),
  T('bottle-cap', 'Bottle cap', 'cap', 'rust', 'common', 'Crinkly edges. Excellent.'),
  T('grey-feather', 'Grey feather', 'feather', 'cream', 'common', 'Soft. It tickled its nose all the way home.'),
  T('sea-glass', 'Sea glass', 'glass', 'sage', 'uncommon', 'Frosted, worn smooth by somewhere far away.'),
  T('blue-marble', 'Swirl marble', 'marble', 'sage', 'uncommon', 'There is a whole sky inside.'),
  T('amber-marble', 'Amber marble', 'marble', 'honey', 'uncommon', 'Glows when the light is low.'),
  T('cowrie', 'Cowrie shell', 'shell', 'cream', 'uncommon', 'Hold it close and you can hear a puddle.'),
  T('scallop', 'Scallop shell', 'shell', 'rust', 'uncommon', 'Ridged like a tiny fan.'),
  T('ribbon', 'Lost ribbon', 'ribbon', 'berry', 'uncommon', 'Someone tied a bow once.'),
  T('old-penny', 'Old penny', 'coin', 'rust', 'uncommon', 'Too old to spend. Just right to keep.'),
  T('thimble', 'Thimble', 'thimble', 'honey', 'uncommon', 'A hat. Clearly a hat.'),
  T('clover', 'Four-leaf clover', 'clover', 'leaf', 'rare', 'Four leaves. It counted twice.'),
  T('tiny-key', 'Tiny key', 'key', 'honey', 'rare', 'Opens something, somewhere.'),
  T('gold-star', 'Paper star', 'star', 'honey', 'rare', 'Folded by careful hands.'),
  T('robin-egg', 'Speckled shell', 'egg', 'sage', 'rare', 'Empty and safe. Someone hatched out of it.'),
  T('cherry-blossom', 'Blossom', 'flower', 'berry', 'common', 'Fell from a tree in full bloom.', 'spring'),
  T('daisy', 'Daisy', 'flower', 'cream', 'common', 'It loves you. It loves you not. It loves you.', 'spring'),
  T('spring-feather', 'Robin feather', 'feather', 'rust', 'uncommon', 'Still warm from the morning.', 'spring'),
  T('beach-shell', 'Whelk shell', 'shell', 'honey', 'common', 'Smells of summer.', 'summer'),
  T('sunflower-seed', 'Sunflower', 'flower', 'honey', 'uncommon', 'Facing the sun, even indoors.', 'summer'),
  T('maple-leaf', 'Maple leaf', 'leaf', 'rust', 'common', 'Red as anything.', 'autumn'),
  T('conker', 'Conker', 'acorn', 'rust', 'common', 'Polished on its fluff.', 'autumn'),
  T('golden-leaf', 'Golden leaf', 'leaf', 'honey', 'rare', 'Caught mid-fall. It was very proud.', 'autumn'),
  T('snowflake', 'Paper snowflake', 'snowflake', 'cream', 'common', 'No two the same. It checked.', 'winter'),
  T('pine-cone', 'Pine cone', 'acorn', 'crust', 'common', 'Prickly, but it was gentle.', 'winter'),
  T('silver-star', 'Silver star', 'star', 'cream', 'rare', 'Fell off a tree, possibly the sky.', 'winter'),
];

const WEIGHT: Record<Rarity, number> = { common: 10, uncommon: 4, rare: 1 };

export function treasureById(id: string): Treasure | undefined {
  return TREASURES.find((t) => t.id === id);
}

/** The season at a moment (northern hemisphere, by month). */
export function seasonAt(t: number): Season {
  const m = new Date(t).getMonth();
  return m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';
}

/** Picks a find for this moment. `random` is 0 to 1. */
export function pickTreasure(at: number, random: number): Treasure {
  const season = seasonAt(at);
  const pool = TREASURES.filter((t) => !t.season || t.season === season);
  const total = pool.reduce((a, t) => a + WEIGHT[t.rarity], 0);
  let roll = random * total;
  for (const t of pool) if ((roll -= WEIGHT[t.rarity]) < 0) return t;
  return pool[0]!;
}
