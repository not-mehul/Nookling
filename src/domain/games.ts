// The three games' rules, apart from their screens, so they can be tested.

export type Game = 'catch' | 'seek' | 'echo' | 'bubbles' | 'keepup' | 'match' | 'fishing' | 'stack' | 'rhythm';
export const GAMES: readonly Game[] = ['catch', 'bubbles', 'keepup', 'match', 'fishing', 'stack', 'rhythm', 'seek', 'echo'];

/** Played inside 30 to 90 seconds, so each fits a spare minute. */
export const QUICK: ReadonlySet<Game> = new Set(['catch', 'bubbles', 'keepup', 'fishing', 'stack', 'rhythm']);

/** One game a day is featured: a little extra fun, and nothing lost by skipping it. */
export function gameOfDay(now: number): Game {
  const d = new Date(now);
  const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  return GAMES[((day % GAMES.length) + GAMES.length) % GAMES.length]!;
}

// ── Bubbles: pop as many as you can before they float away.
export const BUBBLES_MS = 25_000;

// ── Keep it up: tap to bounce it; don't let it touch the floor.
export const KEEPUP_MS = 45_000;
export const KEEPUP_GOAL = 20;
export const GRAVITY = 0.0000028;
export const BOUNCE = -0.0013;

// ── Memory match: six pairs of food cards.
export const MATCH_PAIRS = 6;
/** A shuffled deck: each id twice. */
export function deck(ids: readonly string[], random: () => number = Math.random): string[] {
  const cards = [...ids.slice(0, MATCH_PAIRS), ...ids.slice(0, MATCH_PAIRS)];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}

// ── Puddle fishing: wait for the float to dip, then tap.
export const FISHING_CASTS = 5;
export const BITE_MS = 750;
export type Catch = 'minnow' | 'boot' | 'leaf' | 'button' | 'star';
export function whatBit(random: () => number = Math.random): Catch {
  const r = random();
  return r < 0.45 ? 'minnow' : r < 0.65 ? 'leaf' : r < 0.82 ? 'boot' : r < 0.95 ? 'button' : 'star';
}

// ── Pebble stack: drop each pebble onto the last; overhang falls off.
export const STACK_GOAL = 12;
/** The part of a pebble [x, x+w] that rests on the one below [bx, bx+bw], or null if it misses. */
export function overlap(x: number, w: number, bx: number, bw: number): { x: number; w: number } | null {
  const left = Math.max(x, bx);
  const right = Math.min(x + w, bx + bw);
  return right - left > 0.01 ? { x: left, w: right - left } : null;
}

// ── Rhythm: tap the lane as each note reaches the line.
export const RHYTHM_MS = 30_000;
export const RHYTHM_LANES = 3;
export const RHYTHM_WINDOW = 0.07;
/** Whether a note at `y` (0 top, 1 bottom) is close enough to the line at `line`. */
export function onBeat(y: number, line = 0.85): boolean {
  return Math.abs(y - line) <= RHYTHM_WINDOW;
}

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
  const by: Partial<Record<Game, number>> = {
    echo: result.hits / ECHO_BEST,
    keepup: result.hits / KEEPUP_GOAL,
    stack: result.hits / STACK_GOAL,
    // Every pair found in as few turns as there are pairs is perfect.
    match: MATCH_PAIRS / Math.max(MATCH_PAIRS, result.total),
  };
  return Math.min(1, Math.max(0, by[game] ?? raw));
}
