import { ZONES, maxHrFromAge, zoneBpm, zoneIndexForHr, timeInZones, pctOf, pctOfMax } from '../src/services/hr';

describe('hr', () => {
  test('maxHrFromAge with a floor', () => {
    expect(maxHrFromAge(30)).toBe(190);
    expect(maxHrFromAge(120)).toBe(120); // floored, never below 120
  });
  test('zoneBpm rounds the percentage range', () => {
    const z3 = ZONES[2];
    expect(zoneBpm(z3, 190)).toEqual({ lo: 133, hi: 152 });
  });
  test('zoneIndexForHr classifies and clamps', () => {
    const m = 190;
    expect(zoneIndexForHr(70, m)).toBe(0); // below z1 clamps to z1
    expect(zoneIndexForHr(110, m)).toBe(0);
    expect(zoneIndexForHr(130, m)).toBe(1);
    expect(zoneIndexForHr(150, m)).toBe(2);
    expect(zoneIndexForHr(165, m)).toBe(3);
    expect(zoneIndexForHr(178, m)).toBe(4);
    expect(zoneIndexForHr(999, m)).toBe(4); // above z5 clamps to z5
  });
  test('exact zone thresholds use the inclusive lower bound', () => {
    const m = 190;
    expect(zoneIndexForHr(133, m)).toBe(2); // 0.70 * 190, start of Z3
    expect(zoneIndexForHr(152, m)).toBe(3); // 0.80 * 190, start of Z4
    expect(zoneIndexForHr(171, m)).toBe(4); // 0.90 * 190, start of Z5
  });
  test('timeInZones buckets every sample, sums to total', () => {
    const samples = [100, 130, 150, 165, 188];
    const secs = timeInZones(samples, 190);
    expect(secs.reduce((a, b) => a + b, 0)).toBe(samples.length);
    expect(secs).toHaveLength(5);
  });
  test('pctOf / pctOfMax guard zero', () => {
    expect(pctOf(1, 4)).toBe(25);
    expect(pctOf(1, 0)).toBe(0);
    expect(pctOfMax(95, 190)).toBe(50);
    expect(pctOfMax(95, 0)).toBe(0);
  });
});
