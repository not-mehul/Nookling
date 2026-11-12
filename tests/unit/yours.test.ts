import { describe, expect, it } from 'vitest';
import { HOUR } from '../../src/domain/pet';
import { GARDEN_FOODS, foodById, pantry } from '../../src/domain/foods';
import en from '../../src/i18n/en';
import { DECOR, place } from '../../src/world/decor';
import { SEEDS, grownFoods, growth, harvest, newGarden, plant, seedsFor } from '../../src/world/garden';
import { tally, unlocked } from '../../src/world/progress';
import { CLOTHES, available, collectSeason, newWardrobe, wear } from '../../src/world/wardrobe';
import { newWorld, normaliseWorld } from '../../src/world/world';

const T0 = new Date(2026, 10, 12, 12).getTime();
const has = (k: string) => !!en[k as keyof typeof en];

describe('the garden', () => {
  it('grows in real time, never wilts, and gives a Pantry food', () => {
    let g = plant(newGarden(), 0, 'mint', T0);
    expect(growth(g.plots[0]!, T0).stage).toBe('seed');
    expect(growth(g.plots[0]!, T0 + HOUR).stage).toBe('sprout');
    expect(harvest(g, 0, T0 + HOUR).seed).toBeNull();
    // A month later it is still ripe and waiting.
    expect(growth(g.plots[0]!, T0 + 30 * 24 * HOUR).stage).toBe('ripe');
    const r = harvest(g, 0, T0 + 2 * HOUR);
    expect(r.seed).toBe('mint');
    g = r.garden;
    expect(g.plots[0]).toBeNull();
    expect(grownFoods(g)).toEqual(['mint-sprig']);
    expect(pantry(grownFoods(g)).some((f) => f.id === 'mint-sprig')).toBe(true);
  });

  it('opens more seeds as you harvest, and won’t plant a locked one or a full plot', () => {
    const g = newGarden();
    expect(seedsFor(g).map((s) => s.id)).toEqual(['mint', 'strawberry']);
    expect(plant(g, 0, 'pumpkin', T0)).toBe(g);
    const planted = plant(g, 1, 'mint', T0);
    expect(plant(planted, 1, 'strawberry', T0)).toBe(planted);
    expect(seedsFor({ ...g, harvested: { mint: 6 } })).toHaveLength(SEEDS.length);
  });

  it('has a food and words for every seed', () => {
    for (const s of SEEDS) {
      expect(foodById(s.food)).toBeTruthy();
      expect(has(`seed.${s.id}`)).toBe(true);
    }
    expect(GARDEN_FOODS).toHaveLength(SEEDS.length);
  });
});

describe('decorating', () => {
  it('keeps things inside the room', () => {
    expect(place(-1, 2)).toEqual({ x: 0.05, y: 0.95 });
  });

  it('unlocks things from what it has been up to', () => {
    const world = newWorld(T0);
    const counts = tally(world, null, T0);
    expect(unlocked(DECOR.find((d) => d.id === 'rug')!.unlock, counts)).toBe(true);
    expect(unlocked(DECOR.find((d) => d.id === 'ball')!.unlock, counts)).toBe(false);
    const played = tally({ ...world, arcade: { best: {}, played: { catch: 6, bubbles: 4 } } }, null, T0);
    expect(played.games).toBe(10);
    expect(unlocked(DECOR.find((d) => d.id === 'ball')!.unlock, played)).toBe(true);
  });

  it('names and uses every thing', () => {
    for (const d of DECOR) expect(has(`decor.${d.id}`) && has(`decor.${d.id}.use`)).toBe(true);
  });
});

describe('the wardrobe', () => {
  it('puts on and takes off, one per slot', () => {
    let w = wear(newWardrobe(), 'beret');
    expect(w.wearing.hat).toBe('beret');
    w = wear(w, 'party-hat');
    expect(w.wearing.hat).toBe('party-hat');
    expect(wear(w, 'party-hat').wearing.hat).toBeUndefined();
  });

  it('keeps seasonal things once found in their season', () => {
    const counts = tally(newWorld(T0), null, T0);
    const scarf = CLOTHES.find((c) => c.id === 'scarf')!;
    expect(available(scarf, newWardrobe(), counts, 'summer')).toBe(false);
    const kept = collectSeason(newWardrobe(), 'winter', T0);
    expect(available(scarf, kept, counts, 'summer')).toBe(true);
  });

  it('names every piece', () => {
    for (const c of CLOTHES) expect(has(`clothes.${c.id}`)).toBe(true);
  });
});

describe('older saves', () => {
  it('get an empty nook, garden and wardrobe, and lose anything unknown', () => {
    const w = normaliseWorld({ id: 'world', decor: { rug: { x: 0.5, y: 0.5 }, throne: { x: 0, y: 0 } }, wardrobe: { wearing: { hat: 'bow' } } }, T0);
    expect(Object.keys(w.decor)).toEqual(['rug']);
    expect(w.garden.plots).toEqual([null, null, null]);
    expect(w.wardrobe.wearing).toEqual({});
  });
});
