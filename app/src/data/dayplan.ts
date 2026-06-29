// A prayer-anchored plan for today: the 5 prayers plus suggested meal/training blocks laid
// out around them. Pure & time-only (no I/O). Training is parked in the post-Asr cool window
// to match the heat-coaching guidance.
import { PRAYERS, clockLabel, prayerTime, type PrayerKey } from './prayer';
import type { IconName } from '../components/Icon';

export type PlanKind = 'prayer' | 'block';
export type PlanItem = {
  mins: number; // minutes from midnight (sort key)
  time: string; // "6:42 PM"
  kind: PlanKind;
  label: string;
  sub?: string;
  icon: IconName;
  highlight?: boolean; // the recommended training window
};

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}
function fromMin(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function dayPlan(): PlanItem[] {
  const items: PlanItem[] = PRAYERS.map((p) => ({
    mins: toMin(p.time),
    time: clockLabel(p.time),
    kind: 'prayer',
    label: p.label,
    icon: p.icon,
  }));

  const block = (afterKey: PrayerKey, deltaMin: number, label: string, sub: string, icon: IconName, highlight = false): PlanItem => {
    const mins = toMin(prayerTime(afterKey)) + deltaMin;
    return { mins, time: clockLabel(fromMin(mins)), kind: 'block', label, sub, icon, highlight };
  };

  items.push(block('fajr', 45, 'Light breakfast', 'Protein and a couple of dates to start', 'utensils'));
  items.push(block('dhuhr', 40, 'Lunch', 'Your bigger meal while it’s hot outside', 'utensils'));

  // Main training: midway between Asr and Maghrib, the coolest stretch of daylight.
  const asr = toMin(prayerTime('asr'));
  const maghrib = toMin(prayerTime('maghrib'));
  const trainMins = Math.round((asr + maghrib) / 2);
  items.push({ mins: trainMins, time: clockLabel(fromMin(trainMins)), kind: 'block', label: 'Main workout', sub: 'Post-Asr, the coolest training window', icon: 'dumbbell', highlight: true });

  items.push(block('maghrib', 30, 'Dinner', 'Refuel after the day’s effort', 'utensils'));

  return items.sort((a, b) => a.mins - b.mins);
}

/** Minutes-from-midnight for "now", for dimming past items. */
export function nowMins(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}
