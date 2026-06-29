import { parseImport } from '../src/services/import';
import { buildJson, type ExportData, type SectionKey } from '../src/services/export';

const sampleData: ExportData = {
  workouts: [{ id: 'w1', at: '2026-06-01T10:00:00.000Z', kind: 'sport', sportKey: 'running', minutes: 30, distanceKm: 5, kcal: 300 } as any],
  weight: [
    { at: '2026-06-01T07:00:00.000Z', kg: 80 },
    { at: '2026-06-02T07:00:00.000Z', kg: 79.6 },
  ],
  bp: [{ at: '2026-06-01T07:00:00.000Z', sys: 120, dia: 80 }],
  glucose: [{ at: '2026-06-01T07:00:00.000Z', mgdl: 95 }],
  meds: [{ id: 'm1', name: 'Vitamin D', dose: '1000 IU', schedule: 'Daily', takenDates: ['2026-06-01', '2026-06-02'] }],
  mindful: [{ at: '2026-06-01T22:00:00.000Z', minutes: 5, pattern: 'box' }],
  cycle: [{ start: '2026-05-20', end: '2026-05-25' }],
};

const allKeys: SectionKey[] = ['workouts', 'weight', 'bp', 'glucose', 'meds', 'mindful', 'cycle'];

describe('parseImport round-trips the export format', () => {
  it('accepts a full export built by buildJson', () => {
    const json = buildJson(new Set(allKeys), sampleData);
    const r = parseImport(json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.total).toBe(8); // 1+2+1+1+1+1+1
    expect(new Set(r.sections)).toEqual(new Set(allKeys));
    expect(r.counts.weight).toBe(2);
    expect(r.data.weight).toEqual(sampleData.weight);
    expect(r.data.meds?.[0].name).toBe('Vitamin D');
    expect(r.data.cycle?.[0]).toEqual({ start: '2026-05-20', end: '2026-05-25' });
  });

  it('imports a partial export (only some sections)', () => {
    const json = buildJson(new Set<SectionKey>(['weight', 'meds']), sampleData);
    const r = parseImport(json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(new Set(r.sections)).toEqual(new Set(['weight', 'meds']));
    expect(r.data.bp).toBeUndefined();
  });
});

describe('parseImport rejects bad input', () => {
  it('empty / whitespace', () => {
    expect(parseImport('').ok).toBe(false);
    expect(parseImport('   \n ').ok).toBe(false);
  });
  it('malformed JSON', () => {
    const r = parseImport('{ not json ]');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/valid JSON/i);
  });
  it('valid JSON but an array, not an object', () => {
    const r = parseImport('[1,2,3]');
    expect(r.ok).toBe(false);
  });
  it('an object with no recognised Nabdh sections', () => {
    const r = parseImport(JSON.stringify({ hello: 'world', foo: [1, 2] }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/No Nabdh data/i);
  });
});

describe('parseImport drops junk rows but keeps valid ones', () => {
  it('filters malformed elements within a recognised section', () => {
    const blob = {
      weight: [
        { at: '2026-06-01T07:00:00.000Z', kg: 80 }, // valid
        { at: '2026-06-02T07:00:00.000Z', kg: 'heavy' }, // bad kg
        { kg: 70 }, // missing at
        null,
        42,
      ],
      meds: [{ name: 'Iron' }], // missing schedule/takenDates -> defaults applied
    };
    const r = parseImport(JSON.stringify(blob));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.counts.weight).toBe(1);
    expect(r.data.weight).toEqual([{ at: '2026-06-01T07:00:00.000Z', kg: 80 }]);
    expect(r.data.meds?.[0]).toEqual({ id: 'imp-Iron-0', name: 'Iron', dose: undefined, schedule: 'Daily', takenDates: [] });
  });

  it('a recognised section with the wrong type is skipped, not fatal', () => {
    const r = parseImport(JSON.stringify({ weight: 'oops', meds: [{ name: 'D3' }] }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.counts.weight).toBeUndefined();
    expect(r.counts.meds).toBe(1);
  });

  it('synthesises an id for an imported workout that lacks one', () => {
    const r = parseImport(JSON.stringify({ workouts: [{ at: '2026-06-01T10:00:00.000Z', kind: 'sport', sportKey: 'running' }] }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.counts.workouts).toBe(1);
    const w = r.data.workouts?.[0] as any;
    expect(typeof w.id).toBe('string');
    expect(w.id.length).toBeGreaterThan(0);
    expect(w.sportKey).toBe('running'); // other fields preserved
  });

  it('reports total 0 for a recognised-but-empty export', () => {
    const r = parseImport(JSON.stringify({ weight: [], bp: [] }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.total).toBe(0);
    expect(r.sections).toEqual([]);
  });
});
