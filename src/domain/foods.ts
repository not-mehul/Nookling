// The Pantry: every food, what it does, and when it unlocks. In code, not
// the database, so a rebalance ships with an update and nothing migrates.
// There is no currency and nothing runs out: food is never scarce.

import type { Stage } from '../pet/types';

export type FoodKind = 'meal' | 'fruit' | 'snack' | 'treat';
/** The --pet-food-* token its drawing is filled with. */
export type FoodColour = 'berry' | 'leaf' | 'crust' | 'honey';

export interface Food {
  id: string;
  name: string;
  kind: FoodKind;
  colour: FoodColour;
  /** Added to each need and to Health, 0 to 1. */
  fullness: number;
  mood: number;
  health: number;
  /** The earliest stage that can have it. */
  from: Stage;
  /** One line under its name. */
  note: string;
}

export const FOODS: readonly Food[] = [
  { id: 'milk-drop', name: 'Warm milk drop', kind: 'meal', colour: 'honey', fullness: 0.3, mood: 0.04, health: 0.02, from: 'sprout', note: 'Soft enough for the smallest mouths.' },
  { id: 'oat-cake', name: 'Oat cake', kind: 'meal', colour: 'crust', fullness: 0.4, mood: 0.03, health: 0.02, from: 'sprout', note: 'Plain, filling and kind to the tummy.' },
  { id: 'berry-bowl', name: 'Berry bowl', kind: 'fruit', colour: 'berry', fullness: 0.18, mood: 0.06, health: 0.06, from: 'sprout', note: 'Tart, bright and good for it.' },
  { id: 'acorn-bread', name: 'Acorn bread', kind: 'meal', colour: 'crust', fullness: 0.45, mood: 0.04, health: 0.02, from: 'nookling', note: 'A proper meal, toasted at the edges.' },
  { id: 'moss-soup', name: 'Moss soup', kind: 'meal', colour: 'leaf', fullness: 0.35, mood: 0.02, health: 0.06, from: 'nookling', note: 'Green, warm and restorative.' },
  { id: 'clover-salad', name: 'Clover salad', kind: 'fruit', colour: 'leaf', fullness: 0.2, mood: 0.03, health: 0.07, from: 'nookling', note: 'Crunchy. Lucky, possibly.' },
  { id: 'pear-slice', name: 'Pear slice', kind: 'fruit', colour: 'honey', fullness: 0.15, mood: 0.06, health: 0.05, from: 'nookling', note: 'Juicy enough to need a napkin.' },
  { id: 'plum', name: 'Little plum', kind: 'fruit', colour: 'berry', fullness: 0.15, mood: 0.07, health: 0.05, from: 'nookling', note: 'Round, like its admirer.' },
  { id: 'pumpkin-seeds', name: 'Pumpkin seeds', kind: 'snack', colour: 'honey', fullness: 0.1, mood: 0.08, health: 0.03, from: 'nookling', note: 'A handful to nibble between meals.' },
  { id: 'cheese-crumb', name: 'Cheese crumb', kind: 'snack', colour: 'honey', fullness: 0.12, mood: 0.1, health: 0, from: 'nookling', note: 'Small, sharp, irresistible.' },
  { id: 'honey-drop', name: 'Honey drop', kind: 'treat', colour: 'honey', fullness: 0.05, mood: 0.2, health: -0.01, from: 'sprout', note: 'A treat. Too many and it gets sluggish.' },
  { id: 'star-jelly', name: 'Star jelly', kind: 'treat', colour: 'berry', fullness: 0.06, mood: 0.25, health: -0.01, from: 'grown', note: 'Wobbles. Only for the grown-ups.' },
];

/** Grown in the garden: each joins the Pantry for good after its first harvest. */
export const GARDEN_FOODS: readonly Food[] = [
  { id: 'mint-sprig', name: 'Mint sprig', kind: 'snack', colour: 'leaf', fullness: 0.08, mood: 0.1, health: 0.05, from: 'sprout', note: 'Grown in your garden. Cool on the tongue.' },
  { id: 'strawberry', name: 'Strawberry', kind: 'fruit', colour: 'berry', fullness: 0.15, mood: 0.12, health: 0.05, from: 'sprout', note: 'Grown in your garden. Sun-warm.' },
  { id: 'pea-pod', name: 'Pea pod', kind: 'snack', colour: 'leaf', fullness: 0.12, mood: 0.08, health: 0.06, from: 'sprout', note: 'Grown in your garden. Pop, pop, pop.' },
  { id: 'baby-carrot', name: 'Baby carrot', kind: 'fruit', colour: 'honey', fullness: 0.2, mood: 0.06, health: 0.08, from: 'nookling', note: 'Grown in your garden. Crunchy and proud.' },
  { id: 'little-pumpkin', name: 'Little pumpkin', kind: 'meal', colour: 'honey', fullness: 0.45, mood: 0.1, health: 0.06, from: 'nookling', note: 'Grown in your garden. Roasted, it is a feast.' },
];

const ORDER: readonly Stage[] = ['seedpod', 'sprout', 'nookling', 'grown'];

export function foodById(id: string): Food | undefined {
  return FOODS.find((f) => f.id === id) ?? GARDEN_FOODS.find((f) => f.id === id);
}

/** The Pantry: every food, plus those grown in the garden (by id) and any others (dishes from Mise). */
export function pantry(grown: readonly string[], more: readonly Food[] = []): Food[] {
  return [...FOODS, ...GARDEN_FOODS.filter((f) => grown.includes(f.id)), ...more];
}

/** Whether a pet at this stage can have the food yet. */
export function canHave(food: Food, stage: Stage): boolean {
  return ORDER.indexOf(stage) >= ORDER.indexOf(food.from);
}
