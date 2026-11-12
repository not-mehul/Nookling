import { describe, expect, it } from 'vitest';
import { GAMES, deck, gameOfDay, onBeat, overlap, score, whatBit, MATCH_PAIRS } from '../../src/domain/games';
import { DAILY_BONUS, newArcade, recordGame } from '../../src/world/arcade';
import { nextQuestion, recollection, QUESTIONS } from '../../src/world/chat';
import { LEARN_AFTER, TRICKS, follows, known, swipeOf, teach } from '../../src/world/tricks';
import { newWorld, normaliseWorld } from '../../src/world/world';
import en from '../../src/i18n/en';

const NOON = new Date(2026, 10, 12, 12).getTime();

describe('the arcade', () => {
  it('has a game of the day that changes daily and covers every game', () => {
    const days = new Set(Array.from({ length: GAMES.length }, (_, i) => gameOfDay(NOON + i * 86_400_000)));
    expect(days.size).toBe(GAMES.length);
    expect(gameOfDay(NOON)).toBe(gameOfDay(NOON + 3_600_000));
  });

  it('deals each card twice', () => {
    const cards = deck(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    expect(cards).toHaveLength(MATCH_PAIRS * 2);
    for (const id of new Set(cards)) expect(cards.filter((c) => c === id)).toHaveLength(2);
  });

  it('trims the overhang of a stacked pebble, and drops a miss', () => {
    expect(overlap(0.2, 0.4, 0.3, 0.4)).toEqual({ x: 0.3, w: expect.closeTo(0.3) as unknown as number });
    expect(overlap(0, 0.2, 0.5, 0.2)).toBeNull();
  });

  it('counts a note on the beat only near the line', () => {
    expect(onBeat(0.85)).toBe(true);
    expect(onBeat(0.6)).toBe(false);
  });

  it('lands a catch from every roll', () => {
    expect(whatBit(() => 0)).toBe('minnow');
    expect(whatBit(() => 0.99)).toBe('star');
  });

  it('scores match by turns and stack by height', () => {
    expect(score('match', { hits: 6, total: 6 })).toBe(1);
    expect(score('match', { hits: 6, total: 12 })).toBe(0.5);
    expect(score('stack', { hits: 6, total: 12 })).toBe(0.5);
  });

  it('remembers bests and gives the daily bonus once a day', () => {
    const daily = gameOfDay(NOON);
    let r = recordGame(newArcade(), daily, 0.5, NOON);
    expect(r.daily).toBe(true);
    expect(r.score).toBeCloseTo(0.5 + DAILY_BONUS);
    expect(r.best).toBe(false); // a first score isn't a "new best"
    r = recordGame(r.arcade, daily, 0.7, NOON + 60_000);
    expect(r.daily).toBe(false);
    expect(r.best).toBe(true);
    expect(r.arcade.best[daily]).toBe(0.7);
    expect(r.arcade.played[daily]).toBe(2);
  });
});

describe('tricks', () => {
  it('reads swipes and patterns', () => {
    expect(swipeOf(40, 5)).toBe('right');
    expect(swipeOf(0, -40)).toBe('up');
    expect(swipeOf(5, 5)).toBeNull();
    expect(follows(['up', 'down'], ['up'])).toBe('more');
    expect(follows(['up', 'down'], ['up', 'down'])).toBe('done');
    expect(follows(['up', 'down'], ['down'])).toBe('wrong');
  });

  it('learns a trick after three lessons', () => {
    let tricks: Record<string, number> = {};
    for (let i = 0; i < LEARN_AFTER - 1; i++) tricks = teach(tricks, 'spin');
    expect(known(tricks)).toEqual([]);
    tricks = teach(teach(tricks, 'spin'), 'spin');
    expect(tricks.spin).toBe(LEARN_AFTER);
    expect(known(tricks).map((t) => t.id)).toEqual(['spin']);
  });

  it('names every trick', () => {
    for (const t of TRICKS) expect(en[`trick.${t.id}` as keyof typeof en]).toBeTruthy();
  });
});

describe('chat', () => {
  it('asks each question once, then recalls your answers', () => {
    const chat: Record<string, number> = {};
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = nextQuestion(chat, () => 0);
      expect(q).not.toBeNull();
      chat[q!.id] = i % 3;
    }
    expect(nextQuestion(chat)).toBeNull();
    const [id, reply] = recollection(chat, () => 0)!;
    expect(chat[id]).toBe(reply);
  });

  it('has words for every question and reply', () => {
    for (const q of QUESTIONS) {
      expect(en[`chat.${q.id}.ask` as keyof typeof en]).toBeTruthy();
      for (const r of [0, 1, 2]) for (const part of ['', '.said', '.recall']) expect(en[`chat.${q.id}.${r}${part}` as keyof typeof en]).toBeTruthy();
    }
  });
});

describe('the world', () => {
  it('fills in the arcade, tricks and chat for older saves', () => {
    const old = { ...newWorld(NOON) } as Partial<ReturnType<typeof newWorld>>;
    delete old.arcade;
    delete old.tricks;
    delete old.chat;
    const w = normaliseWorld(old, NOON);
    expect(w.arcade).toEqual({ best: {}, played: {} });
    expect(w.tricks).toEqual({});
    expect(w.chat).toEqual({});
  });
});
