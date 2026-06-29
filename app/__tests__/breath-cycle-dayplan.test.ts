import { PATTERNS, patternByKey, cycleSecs } from '../src/data/breath';
import { phaseForDay, averageCycle, averagePeriod, addDays, daysBetween, type Period } from '../src/data/cycle';
import { dayPlan, nowMins } from '../src/data/dayplan';

describe('breath', () => {
  test('patternByKey falls back to the first pattern', () => {
    expect(patternByKey('box').key).toBe('box');
    expect(patternByKey('nonsense')).toBe(PATTERNS[0]);
  });
  test('cycleSecs sums the steps', () => {
    const box = patternByKey('box');
    expect(cycleSecs(box)).toBe(box.steps.reduce((a, s) => a + s.secs, 0));
  });
});

describe('cycle', () => {
  test('phaseForDay maps the cycle', () => {
    expect(phaseForDay(1, 28, 5)).toBe('menstrual');
    expect(phaseForDay(8, 28, 5)).toBe('follicular');
    expect(phaseForDay(14, 28, 5)).toBe('ovulation');
    expect(phaseForDay(22, 28, 5)).toBe('luteal');
  });
  test('phaseForDay at phase boundaries', () => {
    expect(phaseForDay(5, 28, 5)).toBe('menstrual'); // last day of the period
    expect(phaseForDay(13, 28, 5)).toBe('ovulation'); // ovulation window is +/- 1 around day 14
    expect(phaseForDay(15, 28, 5)).toBe('ovulation');
    expect(phaseForDay(16, 28, 5)).toBe('luteal');
  });
  test('addDays / daysBetween are inverse-consistent', () => {
    expect(addDays('2026-03-01', 10)).toBe('2026-03-11');
    expect(daysBetween('2026-03-01', '2026-03-11')).toBe(10);
  });
  test('averageCycle / averagePeriod fall back to documented defaults', () => {
    const periods: Period[] = [];
    expect(averageCycle(periods)).toBe(28);
    expect(averagePeriod(periods)).toBe(5);
  });
});

describe('dayplan', () => {
  const plan = dayPlan();
  test('items are sorted by time', () => {
    for (let i = 1; i < plan.length; i++) expect(plan[i].mins).toBeGreaterThanOrEqual(plan[i - 1].mins);
  });
  test('contains the 5 prayers + meal/training blocks', () => {
    expect(plan.filter((p) => p.kind === 'prayer')).toHaveLength(5);
    expect(plan.some((p) => p.highlight)).toBe(true); // the workout window
  });
  test('the highlighted workout sits between Asr and Maghrib', () => {
    const asr = plan.find((p) => p.label === 'Asr')!.mins;
    const maghrib = plan.find((p) => p.label === 'Maghrib')!.mins;
    const workout = plan.find((p) => p.highlight)!.mins;
    expect(workout).toBeGreaterThan(asr);
    expect(workout).toBeLessThan(maghrib);
  });
  test('nowMins in range', () => {
    const n = nowMins(new Date(2026, 0, 1, 6, 30));
    expect(n).toBe(390);
  });
});
