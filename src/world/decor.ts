// The nook's things: unlocked by play and finds, arranged by dragging, and
// used by the pet now and then. Positions are fractions of the room.

import type { Reaction } from '../pet/types';
import type { Unlock } from './progress';

export type DecorId = 'rug' | 'cushion' | 'lamp' | 'plant' | 'ball' | 'books' | 'mobile' | 'teacup' | 'lights' | 'frame' | 'blanket' | 'shelf';

export interface Decor {
  id: DecorId;
  unlock: Unlock;
  /** Where it goes when first placed. */
  at: { x: number; y: number };
  /** How the pet uses it: the movement that goes with its line. */
  use: Reaction;
  /** Width as a fraction of the room. */
  size: number;
}

export const DECOR: readonly Decor[] = [
  { id: 'rug', unlock: { by: 'games', n: 0 }, at: { x: 0.5, y: 0.84 }, use: 'squish', size: 0.6 },
  { id: 'cushion', unlock: { by: 'treasures', n: 2 }, at: { x: 0.12, y: 0.86 }, use: 'nuzzle', size: 0.2 },
  { id: 'plant', unlock: { by: 'games', n: 3 }, at: { x: 0.9, y: 0.72 }, use: 'wiggle', size: 0.16 },
  { id: 'lamp', unlock: { by: 'moments', n: 3 }, at: { x: 0.08, y: 0.5 }, use: 'hop', size: 0.15 },
  { id: 'books', unlock: { by: 'chat', n: 2 }, at: { x: 0.86, y: 0.86 }, use: 'nuzzle', size: 0.16 },
  { id: 'mobile', unlock: { by: 'tricks', n: 1 }, at: { x: 0.3, y: 0.08 }, use: 'spin', size: 0.14 },
  { id: 'ball', unlock: { by: 'games', n: 10 }, at: { x: 0.8, y: 0.92 }, use: 'bounce', size: 0.1 },
  { id: 'teacup', unlock: { by: 'treasures', n: 6 }, at: { x: 0.08, y: 0.88 }, use: 'hop', size: 0.1 },
  { id: 'lights', unlock: { by: 'moments', n: 8 }, at: { x: 0.5, y: 0.12 }, use: 'wiggle', size: 0.6 },
  { id: 'frame', unlock: { by: 'days', n: 3 }, at: { x: 0.8, y: 0.18 }, use: 'hop', size: 0.14 },
  { id: 'blanket', unlock: { by: 'days', n: 7 }, at: { x: 0.3, y: 0.9 }, use: 'squish', size: 0.24 },
  { id: 'shelf', unlock: { by: 'treasures', n: 12 }, at: { x: 0.18, y: 0.24 }, use: 'hop', size: 0.22 },
];

export function decorById(id: string): Decor | undefined {
  return DECOR.find((d) => d.id === id);
}

/** Keeps a dragged thing inside the room. */
export function place(x: number, y: number): { x: number; y: number } {
  const c = (v: number) => Math.round(Math.min(0.95, Math.max(0.05, v)) * 1000) / 1000;
  return { x: c(x), y: c(y) };
}
