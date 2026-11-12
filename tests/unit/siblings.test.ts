import { describe, expect, it } from 'vitest';
import { foodById, pantry } from '../../src/domain/foods';
import { KEEP, addBook, addDish, dishFood } from '../../src/world/siblings';
import { normaliseWorld } from '../../src/world/world';

describe('moments from the sibling apps', () => {
  it('turns a cooked dish into a Pantry meal, once per dish', () => {
    let dishes = addDish([], 'Lentil soup', 1);
    dishes = addDish(dishes, 'lentil soup', 2);
    expect(dishes).toHaveLength(1);
    const food = dishFood(dishes[0]!);
    expect(food).toMatchObject({ kind: 'meal', from: 'sprout', name: 'lentil soup' });
    expect(pantry([], [food]).at(-1)).toBe(food);
    expect(foodById(food.id)).toBeUndefined();
  });

  it('keeps each book once, newest first, and only so many', () => {
    let books = addBook([], 'The Hobbit', 'Tolkien', 1);
    books = addBook(books, 'Momo', 'Ende', 2);
    books = addBook(books, 'the hobbit', 'Tolkien', 3);
    expect(books.map((b) => b.title)).toEqual(['the hobbit', 'Momo']);
    for (let i = 0; i < KEEP + 5; i++) books = addBook(books, `Book ${i}`, '', i);
    expect(books).toHaveLength(KEEP);
  });

  it('cleans what storage hands back', () => {
    const w = normaliseWorld({ id: 'world', dishes: [{ id: 'dish-1', name: 'Soup', at: 1 }, { nope: true }], books: 'x' });
    expect(w.dishes).toHaveLength(1);
    expect(w.books).toEqual([]);
  });
});
