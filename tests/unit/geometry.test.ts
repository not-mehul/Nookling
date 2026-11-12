import { describe, expect, it } from 'vitest';
import { BODY, ellipsePath, fluffPath, starPath } from '../../src/pet/geometry';
import { EXPRESSIONS, FORMS, furToken } from '../../src/pet/types';

describe('the pet drawing', () => {
  it('draws a closed ring of tufts, the same every time', () => {
    const d = fluffPath(BODY.r, BODY.bumps, BODY.depth, BODY.ruffle);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/Q/g)).toHaveLength(BODY.bumps);
    expect(fluffPath(BODY.r, BODY.bumps, BODY.depth, BODY.ruffle)).toBe(d);
  });

  it('keeps the fluff close to a circle', () => {
    const d = fluffPath(BODY.r, BODY.bumps, BODY.depth, BODY.ruffle);
    const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      const r = Math.hypot(numbers[i]!, numbers[i + 1]!);
      expect(r).toBeGreaterThanOrEqual(BODY.r - 0.1);
      expect(r).toBeLessThanOrEqual(BODY.r + 2 * BODY.depth * (1 + BODY.ruffle) + 0.1);
    }
  });

  it('draws ellipses and stars as closed paths', () => {
    expect(ellipsePath(0, 0, 10, 12)).toMatch(/^M-10 0a10 12 .*Z$/);
    expect(starPath(0, 0, 10).match(/L/g)).toHaveLength(9);
  });

  it('gives every grown form its own fur, and unwell fur over all of them', () => {
    const furs = FORMS.map((f) => furToken('grown', f, false));
    expect(new Set(furs).size).toBe(FORMS.length);
    expect(furToken('sprout', 'scamp', false)).toBe('--pet-fur');
    expect(furToken('grown', 'gardener', true)).toBe('--pet-fur-unwell');
    expect(EXPRESSIONS).toContain('asleep');
  });
});
