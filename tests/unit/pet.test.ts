import { describe, expect, it } from 'vitest';
import { FOODS, canHave, foodById } from '../../src/domain/foods';
import {
  DAY,
  GROWN_DAYS,
  HOUR,
  MAX_GAP,
  NEEDS,
  asleepAt,
  clean,
  feed,
  formFrom,
  goAway,
  isNight,
  level,
  lights,
  lowestNeed,
  medicine,
  newPet,
  nextBoundary,
  play,
  rollTraits,
  simulate,
  stroke,
  warm,
  type Pet,
  type Schedule,
} from '../../src/domain/pet';

const SCHEDULE: Schedule = { bedtime: '22:30', wake: '07:00', gentle: false };
/** Noon on a Thursday, local time. */
const NOON = new Date(2026, 10, 12, 12, 0).getTime();
const at = (day: number, h: number, m = 0) => new Date(2026, 10, 12 + day, h, m).getTime();

/** A hatched sprout, full of everything, at noon. */
function sprout(overrides: Partial<Pet> = {}): Pet {
  const pet = newPet('p1', 'Pip', NOON, []);
  return { ...pet, stage: 'sprout', hatchedAt: NOON, needs: { fullness: 1, energy: 1, mood: 1, tidiness: 1 }, ...overrides };
}

describe('the sleep schedule', () => {
  it('knows night across midnight', () => {
    expect(isNight(at(0, 23), SCHEDULE)).toBe(true);
    expect(isNight(at(1, 3), SCHEDULE)).toBe(true);
    expect(isNight(at(1, 7), SCHEDULE)).toBe(false);
    expect(isNight(at(0, 12), SCHEDULE)).toBe(false);
  });

  it('handles a bedtime after midnight, and a daytime sleeper', () => {
    expect(isNight(at(0, 1), { ...SCHEDULE, bedtime: '00:30', wake: '08:00' })).toBe(true);
    expect(isNight(at(0, 23), { ...SCHEDULE, bedtime: '00:30', wake: '08:00' })).toBe(false);
    expect(isNight(at(0, 12), { ...SCHEDULE, bedtime: '09:00', wake: '17:00' })).toBe(true);
  });

  it('finds the next bedtime or wake time', () => {
    expect(nextBoundary(NOON, SCHEDULE)).toBe(at(0, 22, 30));
    expect(nextBoundary(at(0, 22, 30), SCHEDULE)).toBe(at(1, 7));
  });
});

describe('simulate', () => {
  it('changes nothing for a seedpod, or when the clock runs backwards', () => {
    const pod = newPet('p1', 'Pip', NOON, []);
    expect(simulate(pod, NOON + DAY, SCHEDULE).pet.needs).toEqual(pod.needs);
    const pet = sprout();
    const back = simulate(pet, NOON - HOUR, SCHEDULE);
    expect(back.pet.needs).toEqual(pet.needs);
    expect(back.events).toEqual([]);
  });

  it('lets needs fall while awake, at their own pace', () => {
    const { pet } = simulate(sprout(), at(0, 15), SCHEDULE);
    expect(pet.needs.fullness).toBeCloseTo(1 - 3 / 9, 5);
    expect(pet.needs.energy).toBeCloseTo(1 - 3 / 16, 5);
    expect(pet.needs.mood).toBeCloseTo(1 - 3 / 12, 5);
    expect(pet.asleep).toBe(false);
  });

  it('sleeps at bedtime, refills energy overnight, and wakes at wake time', () => {
    const start = sprout({ needs: { fullness: 1, energy: 0.3, mood: 1, tidiness: 1 }, asOf: at(0, 22, 30) });
    const { pet, events } = simulate(start, at(1, 7), SCHEDULE);
    expect(events[0]).toMatchObject({ kind: 'fell-asleep', at: at(0, 22, 30) });
    expect(pet.needs.energy).toBe(1);
    expect(pet.needs.mood).toBe(1);
    expect(pet.needs.fullness).toBeCloseTo(1 - 8.5 / 18, 5);
    expect(asleepAt(pet, at(1, 7), SCHEDULE)).toBe(false);
    const woke = simulate(start, at(1, 7, 1), SCHEDULE);
    expect(woke.events.map((e) => e.kind)).toContain('woke');
  });

  it('says when a need runs low, once', () => {
    const { events } = simulate(sprout(), at(0, 21), SCHEDULE);
    const hungry = events.filter((e) => e.kind === 'hungry');
    expect(hungry).toHaveLength(1);
    // Fullness falls from 1 to 0.25 in three quarters of nine hours.
    expect(hungry[0]!.at).toBeCloseTo(NOON + 0.75 * 9 * HOUR, -2);
  });

  it('gives the same answer in one step or two', () => {
    const pet = sprout({ traits: ['greedy', 'playful'], messAt: NOON + 2 * HOUR });
    const end = at(3, 9, 17);
    const once = simulate(pet, end, SCHEDULE).pet;
    const mid = simulate(pet, at(1, 2, 13), SCHEDULE).pet;
    const twice = simulate(mid, end, SCHEDULE).pet;
    for (const need of NEEDS) expect(twice.needs[need]).toBeCloseTo(once.needs[need], 6);
    expect(twice.health).toBeCloseTo(once.health, 6);
    expect(twice.messes).toBe(once.messes);
    expect(twice.stage).toBe(once.stage);
  });

  it('gets unwell after long neglect, and never dies', () => {
    const { pet, events } = simulate(sprout(), at(4, 12), SCHEDULE);
    expect(pet.unwell).toBe(true);
    expect(events.some((e) => e.kind === 'unwell')).toBe(true);
    expect(pet.health).toBeGreaterThanOrEqual(0);
    expect(pet.stage).not.toBe('seedpod');
  });

  it('recovers when looked after', () => {
    const ill = sprout({ unwell: true, health: 0.3 });
    const { pet, events } = simulate(ill, NOON + 4 * HOUR, SCHEDULE);
    expect(pet.health).toBeCloseTo(0.3 + 4 / 12, 5);
    expect(pet.unwell).toBe(false);
    expect(events.some((e) => e.kind === 'recovered')).toBe(true);
  });

  it('turns a meal into a mess two hours later', () => {
    const fed = feed(sprout({ needs: { fullness: 0.5, energy: 1, mood: 1, tidiness: 1 } }), foodById('oat-cake')!, NOON, true);
    expect(fed.ok).toBe(true);
    if (!fed.ok) return;
    const { pet, events } = simulate(fed.pet, NOON + 3 * HOUR, SCHEDULE);
    expect(pet.messes).toBe(1);
    expect(events.find((e) => e.kind === 'mess')?.at).toBe(NOON + 2 * HOUR);
    expect(pet.needs.tidiness).toBeLessThan(0.8);
  });

  it('halves every rate in Gentle mode, and traits nudge them', () => {
    const gentle = simulate(sprout(), at(0, 15), { ...SCHEDULE, gentle: true }).pet;
    expect(1 - gentle.needs.fullness).toBeCloseTo((1 / 9) * 3 * 0.5, 5);
    const greedy = simulate(sprout({ traits: ['greedy', 'tidy'] }), at(0, 15), SCHEDULE).pet;
    expect(1 - greedy.needs.fullness).toBeCloseTo((1 / 9) * 3 * 1.2, 5);
  });

  it('holds everything while it is with a sitter', () => {
    const away = goAway(sprout(), NOON, 3);
    const { pet, events } = simulate(away, NOON + 3 * DAY + HOUR, SCHEDULE);
    expect(pet.awayUntil).toBeNull();
    expect(events[0]).toMatchObject({ kind: 'back-from-sitter', at: NOON + 3 * DAY });
    expect(pet.needs.fullness).toBeCloseTo(1 - 1 / 9, 5);
  });

  it('counts a forward jump of the clock for at most two weeks', () => {
    const far = simulate(sprout(), NOON + 400 * DAY, SCHEDULE).pet;
    const cap = simulate(sprout(), NOON + MAX_GAP, SCHEDULE).pet;
    expect(far.asOf).toBe(NOON + 400 * DAY);
    expect(far.needs).toEqual(cap.needs);
  });

  it('grows from sprout to nookling to a grown form', () => {
    const { pet, events } = simulate(sprout(), NOON + (GROWN_DAYS + 0.5) * DAY, SCHEDULE);
    expect(events.filter((e) => e.kind === 'grew').map((e) => e.stage)).toEqual(['nookling', 'grown']);
    expect(pet.stage).toBe('grown');
    // Left alone for ten days, it grows up a Scamp.
    expect(pet.form).toBe('scamp');
  });
});

describe('care', () => {
  it('feeds, unless asleep, too full, or not old enough', () => {
    const pet = sprout({ needs: { fullness: 0.4, energy: 1, mood: 0.5, tidiness: 1 } });
    const bread = foodById('acorn-bread')!;
    expect(feed(pet, bread, NOON, canHave(bread, 'sprout'))).toEqual({ ok: false, why: 'not-yet' });
    const oat = foodById('oat-cake')!;
    const fed = feed(pet, oat, NOON, true);
    expect(fed.ok && fed.pet.needs.fullness).toBeCloseTo(0.8, 5);
    expect(feed({ ...pet, asleep: true }, oat, NOON, true)).toEqual({ ok: false, why: 'asleep' });
    expect(feed({ ...pet, needs: { ...pet.needs, fullness: 0.99 } }, oat, NOON, true)).toEqual({ ok: false, why: 'full' });
  });

  it('makes it sluggish after more than three treats in two hours', () => {
    const honey = foodById('honey-drop')!;
    let pet = sprout({ needs: { fullness: 0.2, energy: 1, mood: 0.2, tidiness: 1 } });
    for (let i = 0; i < 4; i++) {
      const fed = feed(pet, honey, NOON + i * 60_000, true);
      if (!fed.ok) throw new Error(fed.why);
      pet = fed.pet;
    }
    expect(pet.sluggishUntil).toBe(NOON + 3 * 60_000 + HOUR);
    const mood = pet.needs.mood;
    const fifth = feed(pet, honey, NOON + 5 * 60_000, true);
    expect(fifth.ok && fifth.pet.needs.mood).toBe(mood);
  });

  it('plays, cleans, strokes and gives medicine', () => {
    const pet = sprout({ needs: { fullness: 0.6, energy: 0.6, mood: 0.3, tidiness: 0.4 }, messes: 2, unwell: true, health: 0.3 });
    const played = play(pet, 1);
    expect(played.ok && played.pet.needs.mood).toBeCloseTo(0.58, 5);
    expect(play({ ...pet, needs: { ...pet.needs, energy: 0.05 } }, 1)).toEqual({ ok: false, why: 'too-tired' });
    const cleaned = clean(pet);
    expect(cleaned.ok && cleaned.pet.messes).toBe(0);
    expect(clean(sprout())).toEqual({ ok: false, why: 'clean' });
    const stroked = stroke(pet, 'cuddle');
    expect(stroked.ok && stroked.pet.bond).toBeGreaterThan(0);
    const dosed = medicine(pet);
    expect(dosed.ok && dosed.pet.unwell).toBe(false);
    expect(medicine(sprout())).toEqual({ ok: false, why: 'well' });
  });

  it('puts it to bed early until wake time, and back on schedule after', () => {
    const pet = sprout({ asOf: at(0, 20) });
    const bed = lights(pet, at(0, 20), SCHEDULE);
    if (!bed.ok) throw new Error(bed.why);
    expect(bed.pet.asleep).toBe(true);
    expect(bed.pet.sleepOverride).toEqual({ asleep: true, until: at(0, 22, 30) });
    const later = simulate(bed.pet, at(1, 8), SCHEDULE).pet;
    expect(later.asleep).toBe(false);
    expect(later.sleepOverride).toBeNull();
  });

  it('hatches the seedpod after enough warmth', () => {
    let pod = newPet('p1', 'Pip', NOON, []);
    let hatched = false;
    for (let i = 0; i < 20 && !hatched; i++) ({ pet: pod, hatched } = warm(pod, NOON + i * 1000));
    expect(hatched).toBe(true);
    expect(pod.stage).toBe('sprout');
    expect(pod.hatchedAt).toBe(NOON + 19 * 1000);
  });
});

describe('reading the pet', () => {
  it('names the lowest need and the word for a level', () => {
    expect(lowestNeed(sprout())).toBeNull();
    expect(lowestNeed(sprout({ needs: { fullness: 0.2, energy: 0.1, mood: 1, tidiness: 1 } }))).toBe('energy');
    expect([level(0.9), level(0.5), level(0.2), level(0.05)]).toEqual(['full', 'fine', 'low', 'empty']);
  });

  it('picks the grown form from the care it had', () => {
    expect(formFrom({ attention: 90, foods: ['a', 'b'], rest: 20, neglect: 0 })).toBe('lamplighter');
    expect(formFrom({ attention: 20, foods: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], rest: 10, neglect: 0 })).toBe('gardener');
    expect(formFrom({ attention: 10, foods: ['a'], rest: 56, neglect: 0 })).toBe('dreamer');
    expect(formFrom({ attention: 90, foods: [], rest: 56, neglect: 30 })).toBe('scamp');
    expect(formFrom({ attention: 0, foods: [], rest: 0, neglect: 0 })).toBe('scamp');
  });

  it('rolls two different traits', () => {
    const seq = [0, 0];
    const traits = rollTraits(() => seq.shift() ?? 0);
    expect(new Set(traits).size).toBe(2);
  });

  it('has a dozen foods with unique ids', () => {
    expect(FOODS).toHaveLength(12);
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(12);
  });
});

describe('behaviour', async () => {
  const { drowsy, idleBeat, restingFace, status } = await import('../../src/pet/behaviour');

  it('gets drowsy in the half hour before bedtime', () => {
    expect(drowsy(at(0, 22, 10), SCHEDULE)).toBe(true);
    expect(drowsy(at(0, 21, 50), SCHEDULE)).toBe(false);
    expect(drowsy(at(0, 23), SCHEDULE)).toBe(false);
    expect(restingFace(sprout(), true)).toBe('sleepy');
  });

  it('shows its lowest need on its face', () => {
    expect(restingFace(sprout({ needs: { fullness: 0.1, energy: 0.2, mood: 1, tidiness: 1 } }))).toBe('hungry');
    expect(restingFace(sprout({ asleep: true }))).toBe('asleep');
    expect(status(sprout())).toBe('thriving');
  });

  it('picks idle beats by trait', () => {
    const counts = (traits: Parameters<typeof idleBeat>[0]) => {
      let yawns = 0;
      for (let i = 0; i < 1000; i++) if (idleBeat(traits, () => i / 1000) === 'yawn') yawns++;
      return yawns;
    };
    expect(counts(['sleepy'])).toBeGreaterThan(counts(['playful']));
  });
});
