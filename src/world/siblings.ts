// Moments from the sibling apps: a dish you cooked in Mise joins the Pantry,
// a book you finished in BookShelf or Rosetta gives the pet something to
// read, and a place you went in Waymark sends a postcard for the Treasures.
// Both arrive as nookling:// links (src/platform/incoming.ts) and are only
// kept once you say yes in the Nook.

import type { Food, FoodColour } from '../domain/foods';
import { hash } from './random';

export interface Dish {
  id: string;
  name: string;
  at: number;
}
export interface Postcard {
  id: string;
  city: string;
  country: string;
  /** The day you were there, as YYYY-MM-DD, when Waymark said. */
  date: string;
  /** When it went into the Treasures. */
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

export function postcardId(city: string, country: string, date: string): string {
  return `postcard-${hash(`${city}|${country}|${date}`.toLowerCase()).toString(36)}`;
}

/** Puts a postcard in the Treasures, newest first; the same place on the same day once. */
export function addPostcard(cards: readonly Postcard[], city: string, country: string, date: string, now: number): Postcard[] {
  const id = postcardId(city, country, date);
  return [{ id, city, country, date, at: now }, ...cards.filter((c) => c.id !== id)].slice(0, KEEP);
}

/** A colour for a postcard's stamp, steady for the place. */
export function postcardColour(card: Postcard): FoodColour {
  return COLOURS[hash(card.city + card.country) % COLOURS.length]!;
}
