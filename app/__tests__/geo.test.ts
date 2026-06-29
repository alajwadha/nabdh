import { haversine, routeDistanceKm, elevationGainM, paceSecPerKm, recentPaceSecPerKm, speedKmh, fmtPace, fmtClock, normalize, type GeoPoint } from '../src/services/geo';

const pt = (lat: number, lon: number, extra: Partial<GeoPoint> = {}): GeoPoint => ({ lat, lon, t: 0, ...extra });

describe('geo.haversine', () => {
  test('London to Paris is about 344 km', () => {
    const d = haversine(pt(51.5074, -0.1278), pt(48.8566, 2.3522)) / 1000;
    expect(d).toBeGreaterThan(340);
    expect(d).toBeLessThan(348);
  });
  test('same point is 0', () => {
    expect(haversine(pt(24.7, 46.6), pt(24.7, 46.6))).toBe(0);
  });
});

describe('geo.routeDistanceKm', () => {
  test('sums consecutive legs', () => {
    const km = routeDistanceKm([pt(24.7, 46.6, { seg: 0 }), pt(24.709, 46.6, { seg: 0 })]);
    expect(km).toBeGreaterThan(0.9);
    expect(km).toBeLessThan(1.1);
  });
  test('skips a pause gap (different seg)', () => {
    const pts = [pt(24.7, 46.6, { seg: 0 }), pt(24.7009, 46.6, { seg: 0 }), pt(24.75, 46.65, { seg: 1 }), pt(24.7509, 46.65, { seg: 1 })];
    expect(routeDistanceKm(pts)).toBeLessThan(0.5); // the multi-km cross-seg jump is excluded
  });
});

describe('geo misc', () => {
  test('elevationGainM sums positive deltas only', () => {
    expect(elevationGainM([pt(0, 0, { alt: 10 }), pt(0, 0, { alt: 25 }), pt(0, 0, { alt: 20 })])).toBe(15);
  });
  test('paceSecPerKm guards zero distance', () => {
    expect(paceSecPerKm(0, 100)).toBe(0);
    expect(paceSecPerKm(5, 1500)).toBe(300);
  });
  test('fmtPace formats and handles non-finite', () => {
    expect(fmtPace(300)).toBe('5:00');
    expect(fmtPace(0)).toBe('-');
    expect(fmtPace(Infinity)).toBe('-');
  });
  test('fmtClock under and over an hour', () => {
    expect(fmtClock(75)).toBe('1:15');
    expect(fmtClock(3661)).toBe('1:01:01');
    expect(fmtClock(-5)).toBe('0:00');
  });
  test('speedKmh', () => {
    expect(speedKmh(10, 3600)).toBeCloseTo(10);
    expect(speedKmh(5, 0)).toBe(0);
  });
  test('recentPaceSecPerKm needs >=2 recent points', () => {
    expect(recentPaceSecPerKm([pt(0, 0, { t: 0 })])).toBe(0);
  });
});

describe('geo.normalize', () => {
  test('empty list returns []', () => {
    expect(normalize([], 100, 100)).toEqual([]);
  });
  test('single point lands near centre, no NaN', () => {
    const [p] = normalize([pt(24.7, 46.6)], 100, 80);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
    expect(p.x).toBeCloseTo(50, 0);
    expect(p.y).toBeCloseTo(40, 0);
  });
  test('a flat (E-W) track centres y but spans x', () => {
    const out = normalize([pt(24.70, 46.60), pt(24.70, 46.62)], 200, 100, 10);
    for (const p of out) expect(p.y).toBeCloseTo(50, 5); // degenerate lat -> centred vertically
    expect(Math.abs(out[0].x - out[1].x)).toBeGreaterThan(50); // lon still spans the box
  });
  test('two points stay within the padded box', () => {
    const out = normalize([pt(24.70, 46.60), pt(24.71, 46.62)], 200, 100, 10);
    for (const p of out) {
      expect(p.x).toBeGreaterThanOrEqual(10 - 0.001);
      expect(p.x).toBeLessThanOrEqual(190 + 0.001);
      expect(p.y).toBeGreaterThanOrEqual(10 - 0.001);
      expect(p.y).toBeLessThanOrEqual(90 + 0.001);
    }
  });
});
