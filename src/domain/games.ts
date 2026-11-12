// The three games' rules, apart from their screens, so they can be tested.

export type Game = 'catch' | 'seek' | 'echo';
export const GAMES: readonly Game[] = ['catch', 'seek', 'echo'];

// ── Catch: berries fall; the pet catches them in its mouth.
export const CATCH_MS = 20_000;
export const CATCH_REACH = 0.12;

/** Whether a berry at `berryX` (0 to 1 across the field) lands in a mouth at `petX`. */
export function caught(berryX: number, petX: number): boolean {
  return Math.abs(berryX - petX) <= CATCH_REACH;
}

// ── Hide and seek: it hides behind one of the nook's things.
export const SEEK_SPOTS = ['cushion', 'basket', 'teapot', 'books'] as const;
export type SeekSpot = (typeof SEEK_SPOTS)[number];
export const SEEK_ROUNDS = 5;

export function hidingSpot(random: () => number = Math.random, not?: SeekSpot): SeekSpot {
  const spots = SEEK_SPOTS.filter((s) => s !== not);
  return spots[Math.floor(random() * spots.length)] ?? 'cushion';
}

// ── Echo: it does a little sequence; you repeat it.
export const ECHO_MOVES = ['hop', 'wiggle', 'spin'] as const;
export type EchoMove = (typeof ECHO_MOVES)[number];
export const ECHO_BEST = 6;

export function extend(sequence: EchoMove[], random: () => number = Math.random): EchoMove[] {
  return [...sequence, ECHO_MOVES[Math.floor(random() * ECHO_MOVES.length)] ?? 'hop'];
}

/** How far through the sequence the answer is right: 'wrong', 'more' (keep going) or 'done'. */
export function check(sequence: readonly EchoMove[], answer: readonly EchoMove[]): 'wrong' | 'more' | 'done' {
  for (let i = 0; i < answer.length; i++) if (answer[i] !== sequence[i]) return 'wrong';
  return answer.length === sequence.length ? 'done' : 'more';
}

/** A game's score, 0 to 1, from what happened. */
export function score(game: Game, result: { hits: number; total: number }): number {
  if (result.total <= 0) return 0;
  const raw = result.hits / result.total;
  return Math.min(1, Math.max(0, game === 'echo' ? result.hits / ECHO_BEST : raw));
}
