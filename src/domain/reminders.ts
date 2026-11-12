// When to remind: the simulation is deterministic, so the app knows ahead of
// time when each need will run low. Each time it goes to the background it
// plans the next two days of reminders and hands them to the phone, which
// shows them whether or not the app is running.

import { DAY, HOUR, isNight, simulate, type Pet, type PetEventKind, type Schedule } from './pet';

export type ReminderKind = 'hungry' | 'tired' | 'bored' | 'grubby' | 'unwell';
export interface Reminder {
  at: number;
  /** What it is about; more than one when they fell close together. */
  kinds: ReminderKind[];
}

export const AHEAD = 2 * DAY;
export const PER_DAY = 3;
/** Reminders closer than this become one. */
const MERGE = HOUR;
/** Nothing in the next few minutes: the person has only just left. */
const SOON = 5 * 60_000;

const KINDS: ReadonlySet<PetEventKind> = new Set(['hungry', 'tired', 'bored', 'grubby', 'unwell']);

/** The reminders worth sending in the next two days, at most three a calendar day, none at night. */
export function planReminders(pet: Pet, now: number, schedule: Schedule): Reminder[] {
  if (pet.stage === 'seedpod') return [];
  const from = Math.max(now, pet.asOf);
  // With a sitter, there is nothing to remind about until it is home.
  const { events } = simulate({ ...pet, asOf: from }, from + AHEAD, schedule);
  const plan: Reminder[] = [];
  for (const e of events) {
    if (!KINDS.has(e.kind) || e.at < now + SOON || isNight(e.at, schedule)) continue;
    // Tired near bedtime is just bedtime.
    if (e.kind === 'tired' && isNight(e.at + HOUR, schedule)) continue;
    const last = plan.at(-1);
    if (last && e.at - last.at < MERGE) {
      if (!last.kinds.includes(e.kind as ReminderKind)) last.kinds.push(e.kind as ReminderKind);
      continue;
    }
    plan.push({ at: e.at, kinds: [e.kind as ReminderKind] });
  }
  const perDay = new Map<string, number>();
  return plan.filter((r) => {
    const d = new Date(r.at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const n = perDay.get(key) ?? 0;
    perDay.set(key, n + 1);
    return n < PER_DAY;
  });
}
