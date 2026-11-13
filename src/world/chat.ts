// Chat: it asks a little question in a picture bubble; you pick one of three
// replies. It remembers, and brings your answers up again later.

export interface Question {
  id: string;
  /** What the bubble shows: a treasure or a food, by id. */
  picture: { treasure: string } | { food: string };
}

/** Words live in en.ts as chat.<id>.ask, chat.<id>.<0-2> (the replies),
 * chat.<id>.<0-2>.said (its answer) and chat.<id>.<0-2>.recall (later). */
export const QUESTIONS: readonly Question[] = [
  { id: 'colour', picture: { treasure: 'blue-marble' } },
  { id: 'snack', picture: { food: 'berry-bowl' } },
  { id: 'weather', picture: { treasure: 'snowflake' } },
  { id: 'pebble', picture: { treasure: 'round-pebble' } },
  { id: 'feather', picture: { treasure: 'grey-feather' } },
  { id: 'shell', picture: { treasure: 'cowrie' } },
  { id: 'key', picture: { treasure: 'tiny-key' } },
  { id: 'star', picture: { treasure: 'gold-star' } },
  { id: 'soup', picture: { food: 'moss-soup' } },
  { id: 'leaf', picture: { treasure: 'oak-leaf' } },
];
export const REPLIES = 3;

/** The next thing it wants to ask: the first it hasn't, or null when it has asked everything. */
export function nextQuestion(chat: Record<string, number>, random: () => number = Math.random): Question | null {
  const fresh = QUESTIONS.filter((q) => chat[q.id] === undefined);
  return fresh.length ? fresh[Math.floor(random() * fresh.length)]! : null;
}

/** Something you told it, to bring up again: [question id, reply], or null. */
export function recollection(chat: Record<string, number>, random: () => number = Math.random): [string, number] | null {
  const told = Object.entries(chat).filter(([id, r]) => QUESTIONS.some((q) => q.id === id) && r >= 0 && r < REPLIES);
  return told.length ? told[Math.floor(random() * told.length)]! : null;
}
