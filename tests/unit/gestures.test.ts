import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestureReader } from '../../src/pet/gestures';

describe('reading touches on the pet', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function reader() {
    const seen: string[] = [];
    const r = new GestureReader({
      ontap: () => seen.push('tap'),
      ontickle: (n) => seen.push(`tickle${n}`),
      onstroke: () => seen.push('stroke'),
      oncuddle: (on) => seen.push(on ? 'cuddle' : 'release'),
      onscrub: () => seen.push('scrub'),
    });
    return { r, seen };
  }

  it('reads a tap, then quick taps as a tickle', () => {
    const { r, seen } = reader();
    for (let i = 0; i < 6; i++) {
      r.down(10, 10, i * 100);
      r.up(i * 100 + 50);
    }
    expect(seen).toEqual(['tap', 'tap', 'tap', 'tap', 'tickle5', 'tickle6']);
  });

  it('reads a long press as a cuddle until release', () => {
    const { r, seen } = reader();
    r.down(10, 10, 0);
    vi.advanceTimersByTime(600);
    r.up(700);
    expect(seen).toEqual(['cuddle', 'release']);
  });

  it('reads a sweep across as a stroke, once', () => {
    const { r, seen } = reader();
    r.down(0, 50, 0);
    for (let x = 10; x <= 120; x += 10) r.move(x, 50);
    r.up(500);
    expect(seen).toEqual(['stroke']);
  });

  it('reads back and forth as a scrub, not a stroke', () => {
    const { r, seen } = reader();
    r.down(50, 50, 0);
    let x = 50;
    for (let turn = 0; turn < 6; turn++) {
      const dir = turn % 2 ? -1 : 1;
      for (let i = 0; i < 4; i++) r.move((x += dir * 8), 50);
    }
    r.up(900);
    expect(seen).toEqual(['scrub']);
  });
});
