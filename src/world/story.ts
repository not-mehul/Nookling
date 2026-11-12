// Bedtime stories: pick a friend, a place and a thing, and it makes a short
// story from them. Original words, a different telling for each choice.

import { seeded } from './random';

export const STORY_WORDS = {
  who: ['snail', 'lantern', 'cloud', 'teapot', 'owl', 'pebble'],
  where: ['sea', 'moon', 'teacup', 'forest', 'attic', 'meadow'],
  what: ['key', 'scarf', 'star', 'song', 'map', 'button'],
} as const;
export type StoryPart = keyof typeof STORY_WORDS;
export type StoryPick = { who: (typeof STORY_WORDS.who)[number]; where: (typeof STORY_WORDS.where)[number]; what: (typeof STORY_WORDS.what)[number] };

/**
 * A story as message keys with the chosen words: an opening, two middles
 * picked from several, and an ending. en.ts holds story.open.<n> etc.
 */
export const STORY_SHAPES = { open: 3, middle: 6, end: 3 } as const;

export function tell(pick: StoryPick, name: string): { key: string; n: number }[] {
  const random = seeded(`${name}:${pick.who}:${pick.where}:${pick.what}`);
  const one = (count: number) => Math.floor(random() * count);
  const first = one(STORY_SHAPES.middle);
  let second = one(STORY_SHAPES.middle - 1);
  if (second >= first) second += 1;
  return [
    { key: 'story.open', n: one(STORY_SHAPES.open) },
    { key: 'story.middle', n: first },
    { key: 'story.middle', n: second },
    { key: 'story.end', n: one(STORY_SHAPES.end) },
  ];
}
