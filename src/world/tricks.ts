// Tricks: teach it a little routine by swiping a pattern, three times over.
// Once it knows one, it shows off now and then, and on request.

import type { Reaction } from '../pet/types';

export type Swipe = 'up' | 'down' | 'left' | 'right';
export interface Trick {
  id: 'spin' | 'somersault' | 'bounce' | 'wiggle' | 'squish';
  move: Reaction;
  pattern: readonly Swipe[];
}

export const TRICKS: readonly Trick[] = [
  { id: 'bounce', move: 'bounce', pattern: ['up', 'up'] },
  { id: 'squish', move: 'squish', pattern: ['down', 'down'] },
  { id: 'wiggle', move: 'wiggle', pattern: ['left', 'right', 'left', 'right'] },
  { id: 'spin', move: 'spin', pattern: ['right', 'down', 'left', 'up'] },
  { id: 'somersault', move: 'somersault', pattern: ['up', 'down', 'up'] },
];

/** Three good lessons and it has it. */
export const LEARN_AFTER = 3;
const MIN_SWIPE = 24;

/** Which way a drag went, or null if it was too short to count. */
export function swipeOf(dx: number, dy: number): Swipe | null {
  if (Math.hypot(dx, dy) < MIN_SWIPE) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

/** How far through the pattern the swipes so far are: 'wrong', 'more' or 'done'. */
export function follows(pattern: readonly Swipe[], swipes: readonly Swipe[]): 'wrong' | 'more' | 'done' {
  for (let i = 0; i < swipes.length; i++) if (swipes[i] !== pattern[i]) return 'wrong';
  return swipes.length === pattern.length ? 'done' : 'more';
}

/** One more lesson on a trick; lessons past learned don't count. */
export function teach(tricks: Record<string, number>, id: Trick['id']): Record<string, number> {
  return { ...tricks, [id]: Math.min(LEARN_AFTER, (tricks[id] ?? 0) + 1) };
}

export function known(tricks: Record<string, number>): Trick[] {
  return TRICKS.filter((t) => (tricks[t.id] ?? 0) >= LEARN_AFTER);
}

export function trickById(id: string): Trick | undefined {
  return TRICKS.find((t) => t.id === id);
}
