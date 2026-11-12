import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../src/data/db';
import { foodById } from '../../src/domain/foods';
import { HOUR } from '../../src/domain/pet';
import { petState } from '../../src/state/pet.svelte';

const NOON = new Date(2026, 10, 12, 12, 0).getTime();

describe('the pet store', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(NOON);
    petState.reset();
    await db.pets.clear();
    await db.log.clear();
  });
  afterEach(() => {
    petState.reset();
    vi.useRealTimers();
  });

  it('adopts a seedpod, hatches it and keeps it across a restart', async () => {
    await petState.init();
    expect(petState.pet).toBeNull();
    await petState.adopt('  Pip  ');
    expect(petState.pet?.name).toBe('Pip');
    let hatched = false;
    for (let i = 0; i < 25 && !hatched; i++) hatched = await petState.warm();
    expect(hatched).toBe(true);

    petState.reset();
    vi.setSystemTime(NOON + 3 * HOUR);
    await petState.init();
    expect(petState.pet?.stage).toBe('sprout');
    expect(petState.pet?.needs.fullness).toBeLessThan(0.8);
    expect(petState.log.map((e) => e.kind)).toContain('hatched');
  });

  it('feeds and logs it, and says why when it cannot', async () => {
    await petState.init();
    await petState.adopt('Pip');
    while (!(await petState.warm()));
    const before = petState.pet!.needs.fullness;
    expect(await petState.feed(foodById('oat-cake')!)).toEqual({ ok: true });
    expect(petState.pet!.needs.fullness).toBeGreaterThan(before);
    expect(petState.log[0]).toMatchObject({ kind: 'fed', detail: 'oat-cake' });
    expect(await petState.feed(foodById('acorn-bread')!)).toEqual({ ok: false, why: 'not-yet' });
  });
});
