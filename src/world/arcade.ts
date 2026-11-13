// The arcade's memory: best scores, games played, and the game of the day's
// little extra. Nothing here is a streak: skip a day and nothing is lost.

import { gameOfDay, type Game } from '../domain/games';

export interface Arcade {
  /** Best score per game, 0 to 1. */
  best: Partial<Record<Game, number>>;
  played: Partial<Record<Game, number>>;
  /** The local day (YYYY-MM-DD) the game of the day's bonus was last given. */
  dailyOn?: string;
}

/** The game of the day lifts the score a little, once a day. */
export const DAILY_BONUS = 0.2;

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function newArcade(): Arcade {
  return { best: {}, played: {} };
}

export interface Played {
  arcade: Arcade;
  /** The score that counts, with the day's bonus. */
  score: number;
  best: boolean;
  daily: boolean;
}

export function recordGame(arcade: Arcade, game: Game, score: number, now: number): Played {
  const today = dayKey(now);
  const daily = game === gameOfDay(now) && arcade.dailyOn !== today;
  const had = arcade.best[game];
  const best = had === undefined || score > had;
  return {
    arcade: {
      best: best ? { ...arcade.best, [game]: score } : arcade.best,
      played: { ...arcade.played, [game]: (arcade.played[game] ?? 0) + 1 },
      dailyOn: daily ? today : arcade.dailyOn,
    },
    score: daily ? Math.min(1, score + DAILY_BONUS) : score,
    best: best && had !== undefined,
    daily,
  };
}
