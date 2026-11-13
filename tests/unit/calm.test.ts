import { describe, expect, it } from 'vitest';
import { HOUR } from '../../src/domain/pet';
import en from '../../src/i18n/en';
import { STORY_SHAPES, STORY_WORDS, tell } from '../../src/world/story';
import { VISITORS, VISIT_LENGTH, maybeVisit, stillHere } from '../../src/world/visitors';
import { skyAt, weatherAt } from '../../src/world/weather';
import { normaliseWorld } from '../../src/world/world';

const at = (m: number, d: number, h: number) => new Date(2026, m, d, h).getTime();
const has = (k: string) => !!en[k as keyof typeof en];

describe('the window', () => {
  it('follows the hour', () => {
    expect(skyAt(at(10, 12, 6))).toBe('dawn');
    expect(skyAt(at(10, 12, 12))).toBe('day');
    expect(skyAt(at(10, 12, 19))).toBe('dusk');
    expect(skyAt(at(10, 12, 23))).toBe('night');
  });

  it('keeps the weather for three hours, and never snows in summer', () => {
    expect(weatherAt(at(10, 12, 12))).toBe(weatherAt(at(10, 12, 14)));
    for (let d = 1; d <= 28; d++) for (const h of [0, 6, 12, 18]) expect(weatherAt(at(6, d, h))).not.toBe('snow');
    for (const w of ['clear', 'cloudy', 'rain', 'snow', 'mist']) expect(has(`weather.${w}`) && has(`quiet.line.${w}`)).toBe(true);
  });
});

describe('bedtime stories', () => {
  it('tells the same story for the same words, with two different middles', () => {
    const pick = { who: 'snail', where: 'moon', what: 'key' } as const;
    const a = tell(pick, 'Pip');
    expect(a).toEqual(tell(pick, 'Pip'));
    expect(a).toHaveLength(4);
    expect(a[1]!.n).not.toBe(a[2]!.n);
  });

  it('has words for every choice and every telling', () => {
    for (const [part, words] of Object.entries(STORY_WORDS)) for (const w of words) expect(has(`story.${part}.${w}`)).toBe(true);
    for (const [shape, n] of Object.entries(STORY_SHAPES)) for (let i = 0; i < n; i++) expect(has(`story.${shape}.${i}`)).toBe(true);
  });
});

describe('visitors', () => {
  it('come only after a while away, at most once a day', () => {
    const now = at(10, 12, 12);
    expect(maybeVisit('p', now, HOUR, undefined)).toBeNull();
    // Over many days, some do and some don't.
    const days = Array.from({ length: 40 }, (_, i) => maybeVisit('p', now + i * 24 * HOUR, 3 * HOUR, undefined));
    expect(days.some(Boolean)).toBe(true);
    expect(days.some((v) => !v)).toBe(true);
    const visit = days.find(Boolean)!;
    expect(maybeVisit('p', visit.at + HOUR, 3 * HOUR, visit.at)).toBeNull();
    expect(stillHere(visit, visit.at + VISIT_LENGTH - 1)).toBe(true);
    expect(stillHere(visit, visit.at + VISIT_LENGTH)).toBe(false);
  });

  it('are named, and older saves have none', () => {
    for (const v of VISITORS) expect(has(`visitor.${v.id}`)).toBe(true);
    const w = normaliseWorld({ id: 'world', visit: { id: 'dragon', at: 1, favour: null } });
    expect(w.visit).toBeNull();
    expect(w.visitors).toEqual({});
  });
});
