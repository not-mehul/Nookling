import { describe, expect, it } from 'vitest';
import { ECHO_BEST, caught, check, extend, hidingSpot, score } from '../../src/domain/games';

describe('the games', () => {
  it('catches berries that land near its mouth', () => {
    expect(caught(0.5, 0.55)).toBe(true);
    expect(caught(0.1, 0.5)).toBe(false);
  });

  it('never hides in the same place twice running', () => {
    for (let i = 0; i < 20; i++) expect(hidingSpot(() => i / 20, 'cushion')).not.toBe('cushion');
  });

  it('checks an echo as it is entered', () => {
    const seq = extend(extend([], () => 0), () => 0.9);
    expect(seq).toEqual(['hop', 'spin']);
    expect(check(seq, ['hop'])).toBe('more');
    expect(check(seq, ['hop', 'spin'])).toBe('done');
    expect(check(seq, ['spin'])).toBe('wrong');
  });

  it('scores from 0 to 1', () => {
    expect(score('catch', { hits: 5, total: 10 })).toBe(0.5);
    expect(score('echo', { hits: ECHO_BEST + 3, total: 9 })).toBe(1);
    expect(score('seek', { hits: 0, total: 0 })).toBe(0);
  });
});
