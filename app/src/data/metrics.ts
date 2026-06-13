import type { HealthDaily } from '@nabdh/shared';
import type { TileColor } from '../design-system';
import type { MetricKey } from '../store/app';

export type DeltaKind = 'good' | 'bad' | 'warn';

export type MetricDetail = {
  title: string;
  delta: string;
  deltaKind: DeltaKind;
  chartColor: string;
  base?: number;
  bars?: boolean;
  goal?: number;
  d7: number[];
  d30: number[];
  tiles: [string, string][];
  ins: string;
};

export type MetricDef = {
  key: MetricKey;
  label: string;
  color: TileColor;
  unit?: string;
  hint: string;
  /** Pull a real value from the health summary; falls back to `sample`. */
  read?: (s: HealthDaily | null) => string | number | undefined;
  sample: string;
  detail?: MetricDetail;
};

const fmt = (n?: number) => (n != null ? n.toLocaleString() : undefined);

export const METRICS: Record<MetricKey, MetricDef> = {
  rhr: {
    key: 'rhr',
    label: 'Rest HR',
    color: 'peach',
    unit: 'bpm',
    hint: '▲ 4 vs baseline',
    read: (s) => s?.restingHeartRate,
    sample: '58',
    detail: {
      title: 'Resting heart rate',
      delta: '▲ 4 vs 28-day baseline — trending up',
      deltaKind: 'bad',
      chartColor: '#E08A50',
      base: 54,
      d7: [54, 55, 56, 55, 57, 58, 58],
      d30: [53, 52, 53, 54, 53, 52, 54, 55, 54, 53, 54, 55, 54, 53, 54, 55, 56, 55, 54, 55, 54, 55, 56, 57, 56, 55, 56, 57, 58, 58],
      tiles: [['NIGHT LOW', '52 bpm'], ['WALKING AVG', '84 bpm']],
      ins: 'Heavy dinners after 9 PM cost you +3 bpm overnight. Tonight’s light dinner should pull this back toward 54.',
    },
  },
  hrv: {
    key: 'hrv',
    label: 'HRV',
    color: 'lav',
    unit: 'ms',
    hint: '▼ 6 overnight',
    read: (s) => s?.hrvSdnn,
    sample: '48',
    detail: {
      title: 'Heart rate variability',
      delta: '▼ 6 overnight — 3rd night below baseline',
      deltaKind: 'bad',
      chartColor: '#8E81D6',
      base: 54,
      d7: [56, 58, 54, 57, 52, 50, 48],
      d30: [53, 55, 54, 56, 57, 55, 54, 56, 58, 57, 55, 54, 56, 55, 57, 58, 56, 55, 57, 56, 54, 55, 57, 56, 54, 52, 51, 50, 49, 48],
      tiles: [['NIGHT AVG', '48 ms'], ['28-DAY BASELINE', '54 ms']],
      ins: 'A 3-night slide usually recovers with one disciplined day — easy movement, light dinner, early night.',
    },
  },
  sleep: {
    key: 'sleep',
    label: 'Sleep',
    color: 'mint',
    unit: 'h',
    hint: '▲ 22 min — nice',
    read: (s) => (s?.sleepMinutes != null ? `${Math.floor(s.sleepMinutes / 60)}:${String(s.sleepMinutes % 60).padStart(2, '0')}` : undefined),
    sample: '7:18',
  },
  steps: {
    key: 'steps',
    label: 'Steps',
    color: 'pink',
    hint: '84% of 10k goal',
    read: (s) => fmt(s?.steps),
    sample: '8,432',
    detail: {
      title: 'Steps',
      delta: '84% of 10k goal — 1,568 to go',
      deltaKind: 'good',
      chartColor: '#2E7D5B',
      bars: true,
      goal: 10000,
      d7: [9200, 11400, 7800, 10500, 8900, 12100, 8432],
      d30: [8200, 9500, 7400, 10200, 11000, 9800, 8600, 7900, 10400, 9100, 8800, 11600, 10100, 9300, 8700, 9900, 10800, 9500, 8200, 9700, 10300, 11200, 8900, 9400, 10600, 9800, 7800, 10500, 12100, 8432],
      tiles: [['DISTANCE', '6.2 km'], ['ACTIVE KCAL', '412']],
      ins: 'You move most after Asr — tonight’s easy 30-min walk (~2,400 steps) closes the ring.',
    },
  },
  stress: {
    key: 'stress',
    label: 'Stress',
    color: 'gold',
    hint: 'moderate · 2 spikes',
    sample: '34',
    detail: {
      title: 'Stress',
      delta: 'Moderate — 2 spikes (work, traffic)',
      deltaKind: 'warn',
      chartColor: '#E0A24E',
      base: 30,
      d7: [28, 40, 33, 46, 30, 38, 34],
      d30: [30, 32, 28, 35, 40, 33, 30, 38, 42, 36, 30, 28, 34, 33, 40, 38, 30, 32, 36, 34, 28, 30, 38, 40, 33, 30, 36, 42, 38, 34],
      tiles: [['REST MINUTES', '5h 12m'], ['HIGH MINUTES', '48m']],
      ins: 'Your stress peaks cluster before Dhuhr. A 1-minute breath at midday flattened them last week.',
    },
  },
  spo2: {
    key: 'spo2',
    label: 'Blood O₂',
    color: 'blue',
    unit: '%',
    hint: 'normal overnight',
    read: (s) => s?.spo2,
    sample: '97',
    detail: {
      title: 'Blood oxygen',
      delta: 'Normal range overnight',
      deltaKind: 'good',
      chartColor: '#3E86B0',
      base: 96,
      d7: [96, 97, 96, 97, 98, 97, 97],
      d30: [96, 97, 97, 96, 95, 97, 96, 97, 98, 97, 96, 97, 96, 97, 97, 96, 98, 97, 96, 97, 97, 96, 97, 98, 97, 96, 97, 97, 96, 97],
      tiles: [['NIGHT LOW', '94%'], ['AVERAGE', '97%']],
      ins: 'Steady and healthy. Dips below 90% would be worth a mention — yours never went there.',
    },
  },
  resp: {
    key: 'resp',
    label: 'Resp rate',
    color: 'lav',
    unit: 'br/m',
    hint: 'steady',
    sample: '14',
    detail: {
      title: 'Respiratory rate',
      delta: 'Steady · in your normal band',
      deltaKind: 'good',
      chartColor: '#8E81D6',
      base: 14,
      d7: [14, 15, 14, 14, 15, 14, 14],
      d30: [14, 14, 15, 14, 14, 13, 14, 15, 14, 14, 15, 14, 14, 14, 15, 14, 14, 13, 14, 15, 14, 14, 14, 15, 14, 14, 14, 15, 14, 14],
      tiles: [['NIGHT LOW', '13'], ['NIGHT HIGH', '15']],
      ins: 'A flat respiratory rate is a good sign — no strain or illness creeping in.',
    },
  },
  cals: {
    key: 'cals',
    label: 'Active kcal',
    color: 'pink',
    hint: '68% of 600',
    read: (s) => s?.activeEnergyKcal,
    sample: '412',
    detail: {
      title: 'Active calories',
      delta: '68% of 600 goal — close the ring',
      deltaKind: 'good',
      chartColor: '#C2562C',
      bars: true,
      goal: 600,
      d7: [520, 610, 380, 540, 470, 650, 412],
      d30: [480, 520, 400, 560, 610, 540, 470, 420, 580, 510, 490, 640, 560, 500, 460, 540, 600, 520, 440, 520, 560, 620, 470, 500, 580, 540, 400, 560, 650, 412],
      tiles: [['EXERCISE', '38 min'], ['STAND HRS', '9 / 12']],
      ins: 'Your walk after Asr usually adds ~180 kcal — that closes today’s ring with room to spare.',
    },
  },
  water: {
    key: 'water',
    label: 'Water',
    color: 'blue',
    unit: '/8',
    hint: '5 glasses to go',
    sample: '3',
    detail: {
      title: 'Water',
      delta: '5 glasses to go before bed',
      deltaKind: 'warn',
      chartColor: '#3E86B0',
      bars: true,
      goal: 8,
      d7: [6, 7, 5, 8, 6, 7, 3],
      d30: [6, 7, 5, 8, 6, 7, 6, 5, 8, 7, 6, 7, 5, 6, 8, 7, 6, 5, 7, 6, 8, 7, 6, 5, 7, 6, 5, 8, 7, 3],
      tiles: [['BEST DAY', '8 glasses'], ['WEEK AVG', '6 / day']],
      ins: 'Hydration is your weak spot in the heat — front-load 3 glasses before Dhuhr and you’ll hit goal easily.',
    },
  },
  vo2: {
    key: 'vo2',
    label: 'VO₂ max',
    color: 'mint',
    hint: 'good · top 25%',
    sample: '42',
    detail: {
      title: 'VO₂ max',
      delta: 'Good · top 25% for your age',
      deltaKind: 'good',
      chartColor: '#2E7D5B',
      base: 40,
      d7: [41, 41, 42, 41, 42, 42, 42],
      d30: [40, 40, 41, 41, 40, 41, 42, 41, 42, 41, 42, 42, 41, 42, 41, 42, 42, 41, 42, 42, 41, 42, 42, 42, 41, 42, 42, 42, 42, 42],
      tiles: [['FITNESS AGE', '29'], ['TREND', 'rising']],
      ins: 'Up a point this month. Two zone-2 walks a week is exactly what nudges this — keep going.',
    },
  },
  resil: {
    key: 'resil',
    label: 'Resilience',
    color: 'peach',
    hint: 'recovers well',
    sample: 'Solid',
    detail: {
      title: 'Resilience',
      delta: 'Recovers well from daily stress',
      deltaKind: 'good',
      chartColor: '#E08A50',
      base: 60,
      d7: [62, 58, 65, 55, 60, 63, 61],
      d30: [60, 62, 58, 64, 66, 61, 59, 63, 65, 62, 60, 58, 61, 63, 66, 64, 60, 62, 64, 61, 58, 60, 63, 65, 62, 60, 62, 64, 63, 61],
      tiles: [['DAYTIME RECOVERY', 'Good'], ['STRESS LOAD', 'Fair']],
      ins: 'You bounce back inside a day. Protect sleep this week and you tip into the Strong band.',
    },
  },
};

export const ALL_METRICS: MetricKey[] = [
  'rhr', 'hrv', 'sleep', 'steps', 'stress', 'spo2', 'resp', 'cals', 'water', 'vo2', 'resil',
];

export const METRIC_ICON: Record<MetricKey, string> = {
  rhr: '❤️', hrv: '📈', sleep: '😴', steps: '🚶', stress: '🌀', spo2: '🩸',
  resp: '🫁', cals: '🔥', water: '💧', vo2: '🏃', resil: '🛡',
};
