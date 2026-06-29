import { DISHES, searchDishes, dishById } from '../src/data/dishes';

describe('dishes.searchDishes', () => {
  test('English substring', () => {
    expect(searchDishes('kab').map((d) => d.id)).toContain('kabsa');
  });
  test('Arabic name', () => {
    expect(searchDishes('تمر').map((d) => d.id)).toContain('tamr');
  });
  test('category', () => {
    expect(searchDishes('breakfast').length).toBeGreaterThan(0);
  });
  test('empty query returns all', () => {
    expect(searchDishes('   ')).toHaveLength(DISHES.length);
  });
  test('no match returns empty', () => {
    expect(searchDishes('zzzznomatch')).toHaveLength(0);
  });
});

describe('dishes.dishById', () => {
  test('found / not found', () => {
    expect(dishById('kabsa')?.name).toBe('Kabsa with chicken');
    expect(dishById('nope')).toBeUndefined();
  });
});

describe('dishes macro realism (Atwater)', () => {
  test('every dish reconciles kcal within ~20%', () => {
    for (const d of DISHES) {
      const atwater = 4 * d.protein + 4 * d.carbs + 9 * d.fat;
      if (d.kcal < 20) continue; // near-zero items (coffee) are rounding noise
      const ratio = atwater / d.kcal;
      expect(ratio).toBeGreaterThan(0.8);
      expect(ratio).toBeLessThan(1.2);
    }
  });
  test('all macros and kcal are non-negative numbers', () => {
    for (const d of DISHES) {
      for (const v of [d.kcal, d.protein, d.carbs, d.fat]) {
        expect(typeof v).toBe('number');
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
