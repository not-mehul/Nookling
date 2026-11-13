// Little moments: what it is in the middle of when you look in. One is picked
// each time you come back after a while (and now and then while you watch),
// weighted by its traits and the time of day, so the first glance is new.

import type { Trait } from '../domain/pet';
import type { Expression } from '../pet/types';

export type MomentProp = 'moth' | 'teacup' | 'book' | 'dandelion' | 'ladybug' | 'leaves' | 'puddle' | 'yarn' | 'bubbles' | 'sunbeam' | 'blanket' | 'cloud' | 'snow' | 'flower' | 'mirror' | 'music';
export type TimeOfDay = 'morning' | 'day' | 'evening';

export interface Moment {
  id: string;
  prop: MomentProp;
  /** Its face while caught at it. */
  expression: Expression;
  /** Traits that make it likelier. */
  traits?: Trait[];
  /** Only at this time of day. */
  when?: TimeOfDay;
  /** Only in this season (src/world/treasures.ts seasonAt). */
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export const MOMENTS: readonly Moment[] = [
  { id: 'moth', prop: 'moth', expression: 'surprised', traits: ['playful'], when: 'evening' },
  { id: 'teacup', prop: 'teacup', expression: 'happy', traits: ['shy'] },
  { id: 'book-nap', prop: 'book', expression: 'asleep', traits: ['sleepy'] },
  { id: 'reading', prop: 'book', expression: 'content' },
  { id: 'dandelion', prop: 'dandelion', expression: 'surprised', season: 'spring' },
  { id: 'ladybug', prop: 'ladybug', expression: 'happy', when: 'day' },
  { id: 'leaf-pile', prop: 'leaves', expression: 'happy', traits: ['playful'], season: 'autumn' },
  { id: 'puddle', prop: 'puddle', expression: 'happy', traits: ['playful'] },
  { id: 'yarn', prop: 'yarn', expression: 'grumpy', traits: ['playful'] },
  { id: 'bubbles', prop: 'bubbles', expression: 'surprised' },
  { id: 'sunbeam', prop: 'sunbeam', expression: 'sleepy', traits: ['sleepy'], when: 'day' },
  { id: 'blanket', prop: 'blanket', expression: 'asleep', traits: ['sleepy'], when: 'evening' },
  { id: 'cloud-watching', prop: 'cloud', expression: 'content', when: 'day' },
  { id: 'first-snow', prop: 'snow', expression: 'surprised', season: 'winter' },
  { id: 'flower-sniff', prop: 'flower', expression: 'happy', season: 'summer' },
  { id: 'mirror', prop: 'mirror', expression: 'surprised', traits: ['chatty'] },
  { id: 'humming', prop: 'music', expression: 'happy', traits: ['chatty'] },
  { id: 'tidying', prop: 'leaves', expression: 'content', traits: ['tidy'] },
  { id: 'snack-hunt', prop: 'teacup', expression: 'hungry', traits: ['greedy'] },
  { id: 'morning-stretch', prop: 'sunbeam', expression: 'happy', when: 'morning' },
  { id: 'peekaboo', prop: 'blanket', expression: 'surprised', traits: ['shy'] },
  { id: 'dance', prop: 'music', expression: 'happy', traits: ['playful'] },
];

export function timeOfDay(t: number): TimeOfDay {
  const h = new Date(t).getHours();
  return h < 11 ? 'morning' : h < 17 ? 'day' : 'evening';
}

function seasonOf(t: number): Moment['season'] {
  const m = new Date(t).getMonth();
  return m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';
}

/** A moment for now, avoiding the one just shown. */
export function pickMoment(traits: readonly Trait[], now: number, random: () => number = Math.random, not?: string): Moment {
  const when = timeOfDay(now);
  const season = seasonOf(now);
  const pool = MOMENTS.filter((m) => m.id !== not && (!m.when || m.when === when) && (!m.season || m.season === season));
  const weight = (m: Moment) => 1 + (m.traits?.filter((t) => traits.includes(t)).length ?? 0) * 2 + (m.season ? 1 : 0);
  const total = pool.reduce((a, m) => a + weight(m), 0);
  let roll = random() * total;
  for (const m of pool) if ((roll -= weight(m)) < 0) return m;
  return pool[0]!;
}
