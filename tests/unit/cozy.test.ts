import { describe, expect, it } from 'vitest';
import { COZY_FLOOR, DAY, HOUR, feed, newPet, simulate, type Pet, type Schedule } from '../../src/domain/pet';
import { foodById } from '../../src/domain/foods';
import { FORAGE_EVERY, MAX_WAITING, forage, newWorld, planInvitations, receive, stayed } from '../../src/world/world';
import { pickMoment } from '../../src/world/moments';
import { pickTreasure, seasonAt, TREASURES } from '../../src/world/treasures';

const NOON = new Date(2026, 10, 12, 12, 0).getTime();
const COZY: Schedule = { bedtime: '22:30', wake: '07:00', gentle: false, style: 'cozy' };
const CLASSIC: Schedule = { ...COZY, style: 'tamagotchi' };
const sprout = (): Pet => ({ ...newPet('p', 'Pip', NOON, []), stage: 'sprout', hatchedAt: NOON });

describe('Cozy', () => {
  it('lets needs settle at a floor, and never falls ill from being left', () => {
    const { pet, events } = simulate(sprout(), NOON + 5 * DAY, COZY);
    for (const v of Object.values(pet.needs)) expect(v).toBeGreaterThanOrEqual(COZY_FLOOR - 1e-9);
    expect(pet.unwell).toBe(false);
    expect(events.some((e) => e.kind === 'unwell' || e.kind === 'hungry')).toBe(false);
  });

  it('keeps the classic rules in Tamagotchi mode', () => {
    const { pet, events } = simulate(sprout(), NOON + 5 * DAY, CLASSIC);
    expect(pet.needs.fullness).toBeLessThan(COZY_FLOOR);
    expect(events.some((e) => e.kind === 'hungry')).toBe(true);
    expect(pet.unwell).toBe(true);
  });

  it('makes a mess only every third meal, and tidies up overnight', () => {
    let pet = sprout();
    const oat = foodById('oat-cake')!;
    pet = { ...pet, needs: { ...pet.needs, fullness: 0.1 } };
    let r = feed(pet, oat, NOON, true, 'cozy');
    expect(r.ok && r.pet.messAt).toBeNull();
    pet = r.ok ? { ...r.pet, needs: { ...r.pet.needs, fullness: 0.1 } } : pet;
    r = feed(pet, oat, NOON + 1, true, 'cozy');
    pet = r.ok ? { ...r.pet, needs: { ...r.pet.needs, fullness: 0.1 } } : pet;
    r = feed(pet, oat, NOON + 2, true, 'cozy');
    expect(r.ok && r.pet.messAt).toBe(NOON + 2 + 2 * HOUR);
    const later = simulate(r.ok ? r.pet : pet, NOON + DAY, COZY);
    expect(later.pet.messes).toBe(0);
    expect(later.events.map((e) => e.kind)).toContain('tidied');
  });
});

describe('foraging', () => {
  it('brings back a find every few daytime hours apart, at most three, the same each time', () => {
    const pet = sprout();
    const world = newWorld(NOON);
    const a = forage(world, pet, NOON + 2 * FORAGE_EVERY + 1, COZY);
    expect(a.waiting).toHaveLength(2);
    expect(forage(world, pet, NOON + 2 * FORAGE_EVERY + 1, COZY).waiting).toEqual(a.waiting);
    expect(forage(world, pet, NOON + 3 * DAY, COZY).waiting).toHaveLength(MAX_WAITING);
  });

  it('finds nothing while you are watching', () => {
    const world = stayed(newWorld(NOON), NOON + 10 * HOUR);
    expect(forage(world, sprout(), NOON + 10 * HOUR + 1, COZY).waiting).toHaveLength(0);
  });

  it('hands finds over into the Treasures book', () => {
    const world = forage(newWorld(NOON), sprout(), NOON + FORAGE_EVERY, COZY);
    const { world: after, find, isNew } = receive(world);
    expect(find).not.toBeNull();
    expect(isNew).toBe(true);
    expect(after.waiting).toHaveLength(0);
    expect(after.treasures[find!.treasureId]?.count).toBe(1);
  });

  it('only finds seasonal things in their season', () => {
    const winter = new Date(2026, 0, 10).getTime();
    expect(seasonAt(winter)).toBe('winter');
    for (let i = 0; i < 50; i++) {
      const t = pickTreasure(winter, i / 50);
      expect(!t.season || t.season === 'winter').toBe(true);
    }
    expect(new Set(TREASURES.map((t) => t.id)).size).toBe(TREASURES.length);
  });

  it('invites at most once a day, never at night', () => {
    const times = planInvitations(newWorld(NOON), NOON, COZY);
    expect(times).toEqual([NOON + FORAGE_EVERY, NOON + FORAGE_EVERY + DAY]);
    const late = new Date(2026, 10, 12, 21, 0).getTime();
    expect(planInvitations(newWorld(late), late, COZY)[0]).toBe(new Date(2026, 10, 13, 7, 0).getTime());
  });
});

describe('moments', () => {
  it('picks by time of day and avoids repeating', () => {
    const evening = new Date(2026, 10, 12, 19, 0).getTime();
    for (let i = 0; i < 30; i++) {
      const m = pickMoment(['playful'], evening, () => i / 30, 'moth');
      expect(m.id).not.toBe('moth');
      expect(!m.when || m.when === 'evening').toBe(true);
    }
  });
});
