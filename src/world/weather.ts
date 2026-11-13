// The view from the window: the sky by the hour, and weather that changes
// every few hours, the same for everyone looking at the same moment.

import { seeded } from './random';
import { seasonAt, type Season } from './treasures';

export type Sky = 'dawn' | 'day' | 'dusk' | 'night';
export type Weather = 'clear' | 'cloudy' | 'rain' | 'snow' | 'mist';

export function skyAt(t: number): Sky {
  const h = new Date(t).getHours();
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 18 ? 'day' : h >= 18 && h < 21 ? 'dusk' : 'night';
}

const CHANCES: Record<Season, [Weather, number][]> = {
  spring: [['clear', 4], ['cloudy', 3], ['rain', 3], ['mist', 1]],
  summer: [['clear', 7], ['cloudy', 2], ['rain', 1]],
  autumn: [['clear', 3], ['cloudy', 3], ['rain', 3], ['mist', 2]],
  winter: [['clear', 2], ['cloudy', 3], ['snow', 4], ['mist', 1]],
};

/** The weather for the three-hour window that `t` falls in. */
export function weatherAt(t: number): Weather {
  const d = new Date(t);
  const random = seeded(`weather:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}:${Math.floor(d.getHours() / 3)}`);
  const pool = CHANCES[seasonAt(t)];
  let roll = random() * pool.reduce((a, [, w]) => a + w, 0);
  for (const [w, n] of pool) if ((roll -= n) < 0) return w;
  return 'clear';
}

/** The ambient sound that goes with it. */
export function soundFor(weather: Weather, sky: Sky): 'rain' | 'breeze' | 'night' {
  return weather === 'rain' ? 'rain' : sky === 'night' ? 'night' : 'breeze';
}

/** Breathe with me: in for four, out for six. */
export const BREATHE_IN_MS = 4000;
export const BREATHE_OUT_MS = 6000;
