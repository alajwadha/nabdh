// adhan ships an ESM-only package that node/ts-jest can't require, so we mock it and test
// OUR wrapper logic (formatting + the 5-prayer mapping). The app loads the real adhan via
// Metro at runtime.
jest.mock(
  'adhan',
  () => {
    class Coordinates {
      constructor(public latitude: number, public longitude: number) {}
    }
    const CalculationMethod = { UmmAlQura: () => ({ method: 'ummalqura' }) };
    class PrayerTimes {
      fajr: Date;
      dhuhr: Date;
      asr: Date;
      maghrib: Date;
      isha: Date;
      constructor(_c: unknown, date: Date) {
        const at = (h: number, m: number) => {
          const d = new Date(date);
          d.setHours(h, m, 0, 0);
          return d;
        };
        this.fajr = at(4, 30);
        this.dhuhr = at(11, 55);
        this.asr = at(15, 20);
        this.maghrib = at(18, 40);
        this.isha = at(20, 10);
      }
    }
    return { Coordinates, CalculationMethod, PrayerTimes };
  },
  { virtual: true },
);

import { computePrayerTimes, prayerTime, prayerSource, PRAYERS, shortLabel, clockLabel } from '../src/data/prayer';

describe('prayer.computePrayerTimes (mocked adhan)', () => {
  test('formats the five prayers as HH:MM', () => {
    expect(computePrayerTimes(24.7, 46.6, new Date(2026, 2, 15, 12))).toEqual({
      fajr: '04:30',
      dhuhr: '11:55',
      asr: '15:20',
      maghrib: '18:40',
      isha: '20:10',
    });
  });
  test('times come back in ascending order', () => {
    const t = computePrayerTimes(24.7, 46.6, new Date(2026, 2, 15, 12))!;
    const order = [t.fajr, t.dhuhr, t.asr, t.maghrib, t.isha];
    for (let i = 1; i < order.length; i++) expect(order[i] > order[i - 1]).toBe(true);
  });
});

describe('prayer demo defaults + helpers', () => {
  test('starts on demo Riyadh values', () => {
    expect(prayerSource()).toBe('demo');
    expect(prayerTime('fajr')).toBe('04:12');
    expect(PRAYERS).toHaveLength(5);
    expect(PRAYERS[0].time).toBe(prayerTime('fajr')); // getter reads the live cache
  });
  test('shortLabel / clockLabel', () => {
    expect(shortLabel('15:18')).toBe('3:18');
    expect(clockLabel('18:42')).toBe('6:42 PM');
    expect(clockLabel('00:30')).toBe('12:30 AM');
  });
});
