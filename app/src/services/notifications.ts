// Local notifications / reminders. Wraps expo-notifications so the rest of the app can
// schedule daily reminders without caring whether the native module is present (Expo Go
// without the plugin, web, or this build sandbox all degrade to a no-op instead of crashing).
//
// Reminders are LOCAL and repeat daily at a wall-clock time, no server, no account needed.
// Hydration is a special repeating reminder fired every N hours across the waking window.

// Lazy require so a missing module never breaks import/typecheck.
let N: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  N = require('expo-notifications');
} catch {
  N = null;
}

export type ReminderKey = 'workout' | 'sleep' | 'meal_log' | 'steps' | 'weigh_in';
export type Reminder = { key: ReminderKey; enabled: boolean; time: string }; // time = "HH:MM" 24h
export type Hydration = { enabled: boolean; startHour: number; endHour: number; everyHours: number };

export const REMINDER_COPY: Record<ReminderKey, { icon: string; label: string; title: string; body: string }> = {
  workout: { icon: '🏋️', label: 'Workout', title: 'Time to move 🏋️', body: "Today's session is waiting, even 20 minutes counts." },
  sleep: { icon: '🌙', label: 'Wind down', title: 'Wind down 🌙', body: 'Lights-out soon for a full sleep cycle. Screens away.' },
  meal_log: { icon: '🍽', label: 'Log a meal', title: 'Log your meal 🍽', body: 'A quick log keeps your macros honest.' },
  steps: { icon: '👟', label: 'Step goal', title: 'Step check 👟', body: 'A short walk now keeps your step goal on track.' },
  weigh_in: { icon: '⚖️', label: 'Weigh-in', title: 'Weekly weigh-in ⚖️', body: 'Log your weight to keep the trend accurate.' },
};

export const DEFAULT_REMINDERS: Reminder[] = [
  { key: 'workout', enabled: false, time: '17:30' },
  { key: 'meal_log', enabled: false, time: '13:00' },
  { key: 'steps', enabled: false, time: '19:00' },
  { key: 'sleep', enabled: false, time: '22:30' },
  { key: 'weigh_in', enabled: false, time: '08:00' },
];
export const DEFAULT_HYDRATION: Hydration = { enabled: false, startHour: 9, endHour: 21, everyHours: 2 };

/** True if local notifications are actually available on this build. */
export function notificationsAvailable(): boolean {
  return !!N;
}

/** Ask the OS for permission (idempotent). Returns whether it's granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!N) return false;
  try {
    const current = await N.getPermissionsAsync();
    if (current.granted || current.status === 'granted') return true;
    const req = await N.requestPermissionsAsync();
    return req.granted || req.status === 'granted';
  } catch {
    return false;
  }
}

export function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = (t ?? '').split(':').map((n) => parseInt(n, 10));
  const hour = Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 9;
  const minute = Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0;
  return { hour, minute };
}

// Stable identifier prefixes so each group can be reconciled without clobbering the
// others (a med reminder must survive a reminders/hydration re-sync, and vice versa).
const ID_REMINDER = (key: string) => `rem-${key}`;
const ID_HYDRATION = (h: number) => `hyd-${h}`;
export const ID_MED = (id: string) => `med-${id}`;

/** Cancel only the scheduled notifications whose identifier starts with `prefix`.
 * Best-effort, never throws; falls back to a no-op if the listing API is missing. */
async function cancelByPrefix(prefix: string): Promise<void> {
  if (!N) return;
  try {
    if (typeof N.getAllScheduledNotificationsAsync !== 'function') return;
    const all = await N.getAllScheduledNotificationsAsync();
    for (const n of all ?? []) {
      const id = n?.identifier;
      if (typeof id === 'string' && id.startsWith(prefix)) {
        await N.cancelScheduledNotificationAsync(id);
      }
    }
  } catch {
    /* no-op */
  }
}

/**
 * Reconcile all scheduled reminders with the given config. Cancels everything then
 * re-schedules the enabled ones, simple and idempotent, safe to call on every change.
 */
export async function syncReminders(reminders: Reminder[], hydration: Hydration): Promise<void> {
  if (!N) return;
  try {
    // Reconcile only the reminder/hydration groups by identifier, so med reminders
    // (scheduled separately) are not cancelled out from under us.
    await cancelByPrefix('rem-');
    await cancelByPrefix('hyd-');
    for (const r of reminders) {
      if (!r.enabled) continue;
      const { hour, minute } = parseTime(r.time);
      const copy = REMINDER_COPY[r.key];
      await N.scheduleNotificationAsync({
        identifier: ID_REMINDER(r.key),
        content: { title: copy.title, body: copy.body },
        // SDK 53+ requires the trigger `type` discriminator; a daily calendar trigger
        // repeats at this wall-clock hour:minute. (Without `type` it fires immediately.)
        trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    }
    if (hydration.enabled) {
      const step = Math.max(1, hydration.everyHours);
      for (let h = hydration.startHour; h <= hydration.endHour; h += step) {
        await N.scheduleNotificationAsync({
          identifier: ID_HYDRATION(h),
          content: { title: 'Hydrate 💧', body: 'Time for a glass of water, keep your hydration on target.' },
          // CALENDAR (vs DAILY) so each per-hour slot repeats daily at its own hour.
          trigger: { type: N.SchedulableTriggerInputTypes.CALENDAR, hour: h, minute: 0, repeats: true },
        });
      }
    }
  } catch {
    /* notifications are best-effort; never throw into the UI */
  }
}

export type MedReminderInput = { id: string; name: string; dose?: string; reminderOn?: boolean; reminderTime?: string };

/** Pure: the notification request for a med, or null if the med has no active reminder.
 * Kept pure (no native module) so it can be unit-tested. */
export function buildMedReminder(med: MedReminderInput): { identifier: string; title: string; body: string; hour: number; minute: number } | null {
  if (!med.reminderOn || !med.reminderTime) return null;
  const { hour, minute } = parseTime(med.reminderTime);
  return {
    identifier: ID_MED(med.id),
    title: 'Medication reminder',
    body: med.dose ? `Time to take ${med.name} (${med.dose}).` : `Time to take ${med.name}.`,
    hour,
    minute,
  };
}

/** Reconcile per-med daily reminders. Cancels every med-prefixed notification then
 * reschedules the enabled ones. Mirrors syncReminders; safe to call on every meds change. */
export async function scheduleMedReminders(meds: MedReminderInput[]): Promise<void> {
  if (!N) return;
  try {
    await cancelByPrefix('med-');
    for (const med of meds) {
      const r = buildMedReminder(med);
      if (!r) continue;
      await N.scheduleNotificationAsync({
        identifier: r.identifier,
        content: { title: r.title, body: r.body },
        trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute },
      });
    }
  } catch {
    /* best-effort; never throw into the UI */
  }
}

/** One-off notification at a specific time (e.g. "fast complete"). Returns the id to cancel
 * with, or null if unavailable. Best-effort, never throws. */
export async function scheduleAt(at: Date, title: string, body: string): Promise<string | null> {
  if (!N) return null;
  try {
    if (!(await ensureNotificationPermission())) return null;
    const seconds = Math.round((at.getTime() - Date.now()) / 1000);
    if (seconds < 1) return null;
    return await N.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
    });
  } catch {
    return null;
  }
}

export async function cancelScheduled(id: string | null): Promise<void> {
  if (!N || !id) return;
  try {
    await N.cancelScheduledNotificationAsync(id);
  } catch {
    /* no-op */
  }
}
