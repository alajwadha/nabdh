import { maxHr, hrZones, hydrationGlasses, relativeStrength, bmi, whtr, vo2maxEstimate } from '../src/data/health-metrics';

describe('health-metrics', () => {
  test('maxHr (Tanaka 208 - 0.7*age)', () => {
    expect(maxHr(30)).toBe(187);
  });
  test('hrZones returns 5 ascending bands', () => {
    const z = hrZones(30);
    expect(z).toHaveLength(5);
    for (let i = 1; i < z.length; i++) expect(z[i].lo).toBeGreaterThanOrEqual(z[i - 1].lo);
  });
  test('hydrationGlasses clamps to a sane range', () => {
    const g = hydrationGlasses(80, 1.2, true);
    expect(g).toBeGreaterThanOrEqual(6);
    expect(g).toBeLessThanOrEqual(16);
  });
  test('relativeStrength ratio', () => {
    expect(relativeStrength(100, 80)).toBeCloseTo(1.25);
  });
  test('bmi value + band', () => {
    const b = bmi(80, 180);
    expect(b.value).toBeCloseTo(24.7, 0);
    expect(typeof b.band).toBe('string');
  });
  test('whtr value', () => {
    expect(whtr(80, 180).value).toBeCloseTo(0.44, 1);
  });
  test('vo2maxEstimate positive', () => {
    expect(vo2maxEstimate(190, 60)).toBeGreaterThan(0);
  });
});
