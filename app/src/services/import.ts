// Data import. The pure counterpart to services/export.ts: it takes the text of a
// previously exported Nabdh JSON file and validates it into store-ready slices.
//
// Everything here is pure and node-testable (no native modules, no store access). The
// screen calls parseImport(text), shows the user what will be imported, and on confirm
// applies the returned slices through the stores' own replace setters.
//
// Validation is permissive-but-safe: unknown keys are ignored, and within a recognised
// section any element that doesn't match the expected shape is dropped (never imported as
// junk) rather than failing the whole import. Malformed JSON or a file with no recognised
// Nabdh data is rejected with a clear message.

import type {
  WorkoutSession,
} from '../store/workouts';
import type { WeightEntry, BpEntry, GlucoseEntry, Med } from '../store/health-logs';
import type { MindfulSession } from '../store/mindful';
import type { Period } from '../data/cycle';
import type { ExportData, SectionKey } from './export';

export type ImportData = Partial<ExportData>;

export type ImportParse =
  | { ok: true; data: ImportData; counts: Partial<Record<SectionKey, number>>; total: number; sections: SectionKey[] }
  | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const strArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(str);

// Per-section element validators. Each returns a cleaned record or null to drop it.
const VALIDATORS: { [K in SectionKey]: (e: unknown) => ExportData[K][number] | null } = {
  workouts: (e) => {
    if (!isObj(e) || !str(e.at) || !str(e.kind)) return null;
    // Preserve every exported field, but guarantee an id: downstream screens
    // (workout-history) key on and string-match s.id, so an id-less row would crash.
    return { ...e, id: str(e.id) ? e.id : `imp-${e.at}` } as unknown as WorkoutSession;
  },
  weight: (e) => (isObj(e) && str(e.at) && num(e.kg) ? ({ at: e.at, kg: e.kg } as WeightEntry) : null),
  bp: (e) => (isObj(e) && str(e.at) && num(e.sys) && num(e.dia) ? ({ at: e.at, sys: e.sys, dia: e.dia } as BpEntry) : null),
  glucose: (e) => (isObj(e) && str(e.at) && num(e.mgdl) ? ({ at: e.at, mgdl: e.mgdl } as GlucoseEntry) : null),
  meds: (e) => {
    if (!isObj(e) || !str(e.name)) return null;
    const takenDates = strArr(e.takenDates) ? e.takenDates : [];
    const med: Med = {
      id: str(e.id) ? e.id : `imp-${e.name}-${takenDates.length}`,
      name: e.name,
      dose: str(e.dose) ? e.dose : undefined,
      schedule: str(e.schedule) ? e.schedule : 'Daily',
      takenDates,
    };
    return med;
  },
  mindful: (e) =>
    isObj(e) && str(e.at) && num(e.minutes) && str(e.pattern)
      ? ({ at: e.at, minutes: e.minutes, pattern: e.pattern } as MindfulSession)
      : null,
  cycle: (e) => (isObj(e) && str(e.start) ? ({ start: e.start, end: str(e.end) ? e.end : undefined } as Period) : null),
};

const KEYS = Object.keys(VALIDATORS) as SectionKey[];

/** Parse + validate exported JSON text into store-ready slices. Pure. */
export function parseImport(text: string): ImportParse {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return { ok: false, error: 'Paste the contents of an exported Nabdh JSON file first.' };

  let root: unknown;
  try {
    root = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "That doesn't look like valid JSON. Paste the exported file's full contents." };
  }
  if (!isObj(root)) {
    return { ok: false, error: 'That file is valid JSON but not a Nabdh export (expected an object of data sections).' };
  }

  const data: ImportData = {};
  const counts: Partial<Record<SectionKey, number>> = {};
  const sections: SectionKey[] = [];
  let recognised = false;

  for (const key of KEYS) {
    const raw = (root as Record<string, unknown>)[key];
    if (raw === undefined) continue;
    recognised = true;
    if (!Array.isArray(raw)) continue; // recognised key but wrong type: skip it safely
    const validate = VALIDATORS[key] as (e: unknown) => unknown;
    const cleaned = raw.map(validate).filter((x) => x !== null);
    // Assigning a homogeneous cleaned array back onto its own key is sound; the per-key
    // validator guarantees the element type matches ExportData[key].
    (data as Record<SectionKey, unknown>)[key] = cleaned;
    counts[key] = cleaned.length;
    if (cleaned.length > 0) sections.push(key);
  }

  if (!recognised) {
    return { ok: false, error: 'No Nabdh data found in that file. Make sure you exported in JSON format.' };
  }

  const total = sections.reduce((a, k) => a + (counts[k] ?? 0), 0);
  return { ok: true, data, counts, total, sections };
}
