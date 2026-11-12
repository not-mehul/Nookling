import { describe, expect, it } from 'vitest';
import { DAY, HOUR, goAway, isNight, newPet, type Pet, type Schedule } from '../../src/domain/pet';
import { PER_DAY, planReminders } from '../../src/domain/reminders';

const SCHEDULE: Schedule = { bedtime: '22:30', wake: '07:00', gentle: false };
const NOON = new Date(2026, 10, 12, 12, 0).getTime();

function sprout(overrides: Partial<Pet> = {}): Pet {
  return { ...newPet('p', 'Pip', NOON, []), stage: 'sprout', hatchedAt: NOON, needs: { fullness: 1, energy: 1, mood: 1, tidiness: 1 }, ...overrides };
}

describe('planning reminders', () => {
  it('reminds when it will get hungry', () => {
    const plan = planReminders(sprout(), NOON, SCHEDULE);
    expect(plan[0]?.kinds).toContain('hungry');
    expect(plan[0]?.at).toBeCloseTo(NOON + 0.75 * 9 * HOUR, -3);
  });

  it('never at night, never more than three a day, nothing for a seedpod', () => {
    const plan = planReminders(sprout({ needs: { fullness: 0.3, energy: 0.3, mood: 0.3, tidiness: 0.3 } }), NOON, SCHEDULE);
    for (const r of plan) expect(isNight(r.at, SCHEDULE)).toBe(false);
    const days = new Map<number, number>();
    for (const r of plan) days.set(new Date(r.at).getDate(), (days.get(new Date(r.at).getDate()) ?? 0) + 1);
    for (const n of days.values()) expect(n).toBeLessThanOrEqual(PER_DAY);
    expect(planReminders(newPet('p', 'Pip', NOON, []), NOON, SCHEDULE)).toEqual([]);
  });

  it('merges reminders that fall close together', () => {
    const plan = planReminders(sprout({ needs: { fullness: 0.3, energy: 1, mood: 0.29, tidiness: 1 } }), NOON, SCHEDULE);
    expect(plan[0]?.kinds.length).toBeGreaterThan(1);
  });

  it('stays quiet while it is with a sitter', () => {
    expect(planReminders(goAway(sprout(), NOON, 3), NOON, SCHEDULE)).toEqual([]);
  });

  it('looks two days ahead at most', () => {
    for (const r of planReminders(sprout(), NOON, SCHEDULE)) expect(r.at).toBeLessThanOrEqual(NOON + 2 * DAY);
  });
});
