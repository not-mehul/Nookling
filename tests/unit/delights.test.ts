import { describe, expect, it } from 'vitest';
import { goodDay, isBirthday, siblingProp } from '../../src/domain/delights';
import { DAY, HOUR, newPet, type Pet } from '../../src/domain/pet';

const NOON = new Date(2026, 10, 12, 12, 0).getTime();
const hatched = (): Pet => ({ ...newPet('p', 'Pip', NOON, []), stage: 'sprout' as const, hatchedAt: NOON });

describe('delights', () => {
  it('dresses a pet named after a sibling app', () => {
    expect(siblingProp(' Mise ')).toBe('mise');
    expect(siblingProp('ROSETTA')).toBe('rosetta');
    expect(siblingProp('Pip')).toBeNull();
  });

  it('has a birthday on its hatch day, a year or more on', () => {
    const pet = hatched();
    expect(isBirthday(pet, NOON)).toBe(false);
    expect(isBirthday(pet, new Date(2027, 10, 12, 9).getTime())).toBe(true);
    expect(isBirthday(pet, new Date(2027, 10, 13, 9).getTime())).toBe(false);
    expect(isBirthday({ ...pet, hatchedAt: null }, new Date(2027, 10, 12).getTime())).toBe(false);
  });

  it('celebrates the first whole day with every need above half, once', () => {
    let pet = hatched();
    let r = goodDay(pet, NOON);
    expect(r.pet.goodSince).toBe(NOON);
    r = goodDay(r.pet, NOON + 12 * HOUR);
    expect(r.celebrate).toBe(false);
    // A dip starts the count again.
    r = goodDay({ ...r.pet, needs: { ...r.pet.needs, mood: 0.4 } }, NOON + 13 * HOUR);
    expect(r.pet.goodSince).toBeNull();
    pet = { ...r.pet, needs: { ...r.pet.needs, mood: 0.9 } };
    r = goodDay(pet, NOON + 14 * HOUR);
    r = goodDay(r.pet, NOON + 14 * HOUR + DAY);
    expect(r.celebrate).toBe(true);
    expect(goodDay(r.pet, NOON + 3 * DAY).celebrate).toBe(false);
  });
});
