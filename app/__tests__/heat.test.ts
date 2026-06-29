import { heatLevel, bestWindow, extraGlasses, hourLabel } from '../src/data/heat';
import type { WeatherHour } from '../src/services/weather';

const hour = (h: number, feelsC: number): WeatherHour => ({ iso: `2026-06-28T${String(h).padStart(2, '0')}:00`, hour: h, tempC: feelsC, feelsC });

describe('heat.heatLevel', () => {
  test('bands', () => {
    expect(heatLevel(45).key).toBe('extreme');
    expect(heatLevel(40).key).toBe('high');
    expect(heatLevel(35).key).toBe('moderate');
    expect(heatLevel(28).key).toBe('low');
  });
});

describe('heat.bestWindow', () => {
  const hours = Array.from({ length: 24 }, (_, h) => hour(h, Math.round(30 + 12 * Math.sin((h - 9) / 24 * 6.28))));
  test('prefers the coolest hour after Asr (asserts the actual pick)', () => {
    const w = bestWindow(hours, 13, 15);
    expect(w).not.toBeNull();
    expect(w!.startHour).toBe(23); // coolest post-Asr hour in the sine curve
    expect(w!.feelsC).toBe(24);
    expect(w!.afterAsr).toBe(true);
  });
  test('on a tie, keeps the earliest hour', () => {
    const flat = [hour(16, 30), hour(17, 30), hour(18, 30)];
    expect(bestWindow(flat, 16, 15)!.startHour).toBe(16);
  });
  test('null when no future hours remain', () => {
    expect(bestWindow(hours, 24, 15)).toBeNull();
  });
  test('falls back to remaining hours when Asr has passed', () => {
    const w = bestWindow(hours, 20, 15);
    expect(w).not.toBeNull();
    expect(w!.startHour).toBeGreaterThanOrEqual(20);
  });
});

describe('heat misc', () => {
  test('extraGlasses never negative', () => {
    expect(extraGlasses(0.4)).toBe(2);
    expect(extraGlasses(-1)).toBe(0);
  });
  test('hourLabel 12h', () => {
    expect(hourLabel(0)).toBe('12 AM');
    expect(hourLabel(13)).toBe('1 PM');
  });
});
