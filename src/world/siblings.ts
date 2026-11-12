// Moments from the sibling apps: a dish you cooked in Mise joins the Pantry,
// and a book you finished in BookShelf gives the pet something to read.
// Both arrive as nookling:// links (src/platform/incoming.ts) and are only
// kept once you say yes in the Nook.

import type { Food, FoodColour } from '../domain/foods';
import { hash } from './random';

export interface Dish {
  id: string;
  name: string;
  at: number;
}
export interface Book {
  title: string;
  author: string;
  at: number;
}

const COLOURS: readonly FoodColour[] = ['berry', 'leaf', 'crust', 'honey'];
/** At most this many of each; the oldest make way. */
export const KEEP = 40;

export function dishId(name: string): string {
  return `dish-${hash(name.toLowerCase()).toString(36)}`;
}

/** A dish from Mise as a Pantry food: a hearty meal, cooked by you. */
export function dishFood(dish: Dish): Food {
  return {
    id: dish.id,
    name: dish.name,
    kind: 'meal',
    colour: COLOURS[hash(dish.name) % COLOURS.length]!,
    fullness: 0.4,
    mood: 0.1,
    health: 0.04,
    from: 'sprout',
    note: 'You cooked this, in Mise.',
  };
}

export function addDish(dishes: readonly Dish[], name: string, now: number): Dish[] {
  const id = dishId(name);
  return [{ id, name, at: now }, ...dishes.filter((d) => d.id !== id)].slice(0, KEEP);
}

export function addBook(books: readonly Book[], title: string, author: string, now: number): Book[] {
  const same = (b: Book) => b.title.toLowerCase() === title.toLowerCase();
  return [{ title, author, at: now }, ...books.filter((b) => !same(b))].slice(0, KEEP);
}
