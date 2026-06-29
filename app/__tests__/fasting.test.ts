import { PLANS, planState, ramadanState, fastingState, fmtCountdown, planByKey } from '../src/data/fasting';

const H = 3600000;

describe('fasting.planState (16:8)', () => {
  const plan = PLANS.find((p) => p.key === '16:8')!;
  const start = Date.UTC(2026, 5, 28, 20, 0); // started fast at 20:00
  test('inside the fasting window', () => {
    const s = planState(plan, start, start + 4 * H);
    expect(s.phase).toBe('fasting');
    expect(Math.round(s.secondsLeft / 3600)).toBe(12);
  });
  test('flips to eating after fastHours', () => {
    const s = planState(plan, start, start + 16 * H);
    expect(s.phase).toBe('eating');
    expect(Math.round(s.secondsLeft / 3600)).toBe(8);
  });
  test('cycles back to fasting after a full day', () => {
    expect(planState(plan, start, start + 24 * H).phase).toBe('fasting');
  });
  test('1ms before the flip is still fasting (boundary)', () => {
    const s = planState(plan, start, start + 16 * H - 1);
    expect(s.phase).toBe('fasting');
    expect(s.secondsLeft).toBeLessThanOrEqual(1);
    expect(s.progress).toBeGreaterThan(0.99);
  });
  test('progress is between 0 and 1', () => {
    const s = planState(plan, start, start + 8 * H);
    expect(s.progress).toBeGreaterThanOrEqual(0);
    expect(s.progress).toBeLessThanOrEqual(1);
  });
});

describe('fasting.ramadanState', () => {
  const at = (h: number, m = 0) => new Date(2026, 2, 15, h, m).getTime();
  test('daytime is fasting', () => {
    expect(ramadanState(at(12)).phase).toBe('fasting');
  });
  test('pre-dawn is eating (overnight window)', () => {
    expect(ramadanState(at(2)).phase).toBe('eating');
  });
  test('after maghrib is eating', () => {
    expect(ramadanState(at(20)).phase).toBe('eating');
  });
});

describe('fasting helpers', () => {
  test('fmtCountdown', () => {
    expect(fmtCountdown(3661)).toBe('1:01:01');
    expect(fmtCountdown(-10)).toBe('0:00:00');
  });
  test('planByKey falls back to a default plan', () => {
    expect(planByKey('nonsense').fastHours).toBeGreaterThan(0);
    expect(planByKey('ramadan').key).toBe('ramadan');
  });
  test('fastingState routes ramadan vs plan', () => {
    expect(fastingState('ramadan', null).phase).toMatch(/fasting|eating/);
    expect(fastingState('16:8', Date.now()).phase).toBe('fasting');
  });
});
