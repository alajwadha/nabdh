// Data export. Gathers what's in the local stores into a single JSON or CSV file and
// hands it to the native share sheet. Mirrors services/notifications.ts: the native
// modules (expo-file-system / expo-sharing) are lazy-required so a missing module (web,
// Expo Go without the plugin, this sandbox) degrades to a no-op instead of crashing.
//
// Nothing here fabricates data — every row comes from the stores the caller passes in.

import type { WorkoutSession } from '../store/workouts';
import type { WeightEntry, BpEntry, GlucoseEntry, Med } from '../store/health-logs';
import type { MindfulSession } from '../store/mindful';
import type { Period } from '../data/cycle';
import type { IconName } from '../components/Icon';

// Lazy require so a missing native module never breaks import/typecheck.
let FS: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FS = require('expo-file-system/legacy');
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    FS = require('expo-file-system');
  } catch {
    FS = null;
  }
}
let Sharing: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sharing = require('expo-sharing');
} catch {
  Sharing = null;
}

export type ExportData = {
  workouts: WorkoutSession[];
  weight: WeightEntry[];
  bp: BpEntry[];
  glucose: GlucoseEntry[];
  meds: Med[];
  mindful: MindfulSession[];
  cycle: Period[];
};

export type SectionKey = keyof ExportData;
export type ExportFormat = 'json' | 'csv';
export type ExportResult = 'shared' | 'unavailable' | 'empty' | 'error';

type Tint = 'mint' | 'blue' | 'peach' | 'lav' | 'gold' | 'pink';

type Section = {
  key: SectionKey;
  label: string;
  icon: IconName;
  tint: Tint;
  csvHeader: string;
  csvRows: (d: ExportData) => string[];
};

// CSV field escaping (RFC-4180-ish): quote when the value holds a comma, quote or newline.
// Also guard spreadsheet formula injection — a free-text field (e.g. a medication name)
// starting with = + - @ tab or CR is executed as a formula by Excel/Sheets/Numbers, so we
// prefix it with a single quote to neutralise it.
function f(v: string | number | undefined | null): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const SECTIONS: Section[] = [
  {
    key: 'workouts',
    label: 'Workouts',
    icon: 'dumbbell',
    tint: 'mint',
    csvHeader: 'date,kind,exercise,sets,volume,e1rm,minutes,kcal,distanceKm',
    csvRows: (d) =>
      d.workouts.map((w) =>
        [
          f(w.at),
          f(w.kind),
          f(w.exKey ?? w.sportKey),
          f(w.sets?.map((s) => `${s.weight}x${s.reps}`).join(' ')),
          f(w.volume),
          f(w.e1rm),
          f(w.minutes),
          f(w.kcal),
          f(w.distanceKm),
        ].join(','),
      ),
  },
  {
    key: 'weight',
    label: 'Weight',
    icon: 'scale',
    tint: 'mint',
    csvHeader: 'date,kg',
    csvRows: (d) => d.weight.map((w) => `${f(w.at)},${f(w.kg)}`),
  },
  {
    key: 'bp',
    label: 'Blood pressure',
    icon: 'heart-pulse',
    tint: 'pink',
    csvHeader: 'date,systolic,diastolic',
    csvRows: (d) => d.bp.map((b) => `${f(b.at)},${f(b.sys)},${f(b.dia)}`),
  },
  {
    key: 'glucose',
    label: 'Glucose',
    icon: 'droplet',
    tint: 'blue',
    csvHeader: 'date,mgdl',
    csvRows: (d) => d.glucose.map((g) => `${f(g.at)},${f(g.mgdl)}`),
  },
  {
    key: 'meds',
    label: 'Medications',
    icon: 'pill',
    tint: 'gold',
    csvHeader: 'name,dose,schedule,timesTaken',
    csvRows: (d) => d.meds.map((m) => [f(m.name), f(m.dose), f(m.schedule), f(m.takenDates.length)].join(',')),
  },
  {
    key: 'mindful',
    label: 'Breathing',
    icon: 'wind',
    tint: 'lav',
    csvHeader: 'date,minutes,pattern',
    csvRows: (d) => d.mindful.map((s) => `${f(s.at)},${f(s.minutes)},${f(s.pattern)}`),
  },
  {
    key: 'cycle',
    label: 'Cycle',
    icon: 'calendar',
    tint: 'pink',
    csvHeader: 'start,end',
    csvRows: (d) => d.cycle.map((p) => `${f(p.start)},${f(p.end)}`),
  },
];

export function recordCount(key: SectionKey, data: ExportData): number {
  return data[key].length;
}

export function totalRecords(selected: Set<SectionKey>, data: ExportData): number {
  return [...selected].reduce((a, k) => a + recordCount(k, data), 0);
}

/** Pretty-printed JSON of just the selected sections, plus a small meta header. */
export function buildJson(selected: Set<SectionKey>, data: ExportData): string {
  const out: Record<string, unknown> = {
    app: 'Nabdh',
    exportedAt: new Date().toISOString(),
    sections: SECTIONS.filter((s) => selected.has(s.key)).map((s) => s.key),
  };
  for (const s of SECTIONS) if (selected.has(s.key)) out[s.key] = data[s.key];
  return JSON.stringify(out, null, 2);
}

/** One readable text file with a `# Section` block per selected data type. */
export function buildCsv(selected: Set<SectionKey>, data: ExportData): string {
  const blocks: string[] = [`# Nabdh export — ${new Date().toISOString()}`];
  for (const s of SECTIONS) {
    if (!selected.has(s.key)) continue;
    const rows = s.csvRows(data);
    blocks.push(`# ${s.label} (${rows.length})\n${s.csvHeader}\n${rows.join('\n')}`);
  }
  return blocks.join('\n\n') + '\n';
}

/** True if a real file can be written and shared on this build. */
export function sharingAvailable(): boolean {
  return !!(FS && Sharing);
}

export async function exportAndShare(
  format: ExportFormat,
  selected: Set<SectionKey>,
  data: ExportData,
): Promise<ExportResult> {
  if (totalRecords(selected, data) === 0) return 'empty';
  const content = format === 'json' ? buildJson(selected, data) : buildCsv(selected, data);
  if (!FS || !Sharing) return 'unavailable';
  let uri: string;
  try {
    const dir = FS.cacheDirectory ?? FS.documentDirectory;
    if (!dir) return 'unavailable';
    const stamp = new Date().toISOString().slice(0, 10);
    uri = `${dir}nabdh-export-${stamp}.${format}`;
    await FS.writeAsStringAsync(uri, content);
    if (typeof Sharing.isAvailableAsync === 'function' && !(await Sharing.isAvailableAsync())) return 'unavailable';
  } catch {
    return 'error';
  }
  // The file is written; handing it to the share sheet is best-effort. Dismissing the
  // sheet rejects on iOS — that's a cancel, not a failure, so we don't surface an error.
  try {
    await Sharing.shareAsync(uri, {
      mimeType: format === 'json' ? 'application/json' : 'text/csv',
      dialogTitle: 'Export Nabdh data',
      UTI: format === 'json' ? 'public.json' : 'public.comma-separated-values-text',
    });
  } catch {
    /* user cancelled / dismissed — the file was still prepared */
  }
  return 'shared';
}
