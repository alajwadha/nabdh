import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Screen, Toggle } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { useAppState } from '../src/store/app';
import { REMINDER_COPY, notificationsAvailable, type ReminderKey } from '../src/services/notifications';
import { Icon, type IconName } from '../src/components/Icon';

const RICON: Record<ReminderKey, IconName> = { workout: 'dumbbell', meal_log: 'utensils', steps: 'footprints', sleep: 'moon', weigh_in: 'scale' };


function fmt(time: string) {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  const ap = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}
// nudge a "HH:MM" time by ±30 min, clamped to the day
function bump(time: string, deltaMin: number) {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  let total = Math.max(0, Math.min(23 * 60 + 30, h * 60 + m + deltaMin));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function TimeStepper({ time, onChange, dim }: { time: string; onChange: (t: string) => void; dim: boolean }) {
  const { colors } = useTheme();
  const Btn = ({ label, d }: { label: string; d: number }) => (
    <Pressable onPress={() => onChange(bump(time, d))} hitSlop={8} accessibilityRole="button" accessibilityLabel={label === '+' ? 'Later by 30 minutes' : 'Earlier by 30 minutes'} style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={label === '+' ? 'plus' : 'minus'} size={15} color={colors.textSecondary} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: dim ? 0.4 : 1 }}>
      <Btn label="-" d={-30} />
      <AppText variant="caption" style={{ width: 64, textAlign: 'center' }}>{fmt(time)}</AppText>
      <Btn label="+" d={30} />
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View>
      <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: spacing.sm, marginLeft: 4 }}>
        {title}
      </AppText>
      <View style={{ backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: spacing.lg }}>
        {children}
      </View>
    </View>
  );
}

export default function Reminders() {
  const { colors } = useTheme();
  const router = useRouter();
  const { reminders, hydration, setReminder, setHydration, requestRemindersPermission } = useAppState();
  const [granted, setGranted] = useState<boolean | null>(null);

  // Once a reminder is enabled we need OS permission; ask the first time the user enables one.
  const anyOn = reminders.some((r) => r.enabled) || hydration.enabled;
  useEffect(() => {
    if (anyOn && granted === null) requestRemindersPermission().then(setGranted);
  }, [anyOn, granted, requestRemindersPermission]);

  const order: ReminderKey[] = ['workout', 'meal_log', 'steps', 'sleep', 'weigh_in'];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Reminders</AppText>
      </View>

      <AppText variant="body" color={colors.textSecondary}>
        Gentle nudges, on your schedule. These are local to your phone, no account, no server. Toggle any off anytime.
      </AppText>

      {!notificationsAvailable() && (
        <View style={{ backgroundColor: colors.navBg, borderRadius: radii.md, padding: spacing.md }}>
          <AppText variant="caption" color={colors.textMuted}>
            Notifications need a development/production build (not Expo Go). Your choices are saved and will schedule once installed.
          </AppText>
        </View>
      )}
      {notificationsAvailable() && granted === false && (
        <View style={{ backgroundColor: colors.navBg, borderRadius: radii.md, padding: spacing.md }}>
          <AppText variant="caption" color={colors.warning}>
            Notifications are turned off for Nabdh. Enable them in Settings to receive reminders.
          </AppText>
        </View>
      )}

      <Group title="DAILY REMINDERS">
        {order.map((key, i) => {
          const r = reminders.find((x) => x.key === key)!;
          const copy = REMINDER_COPY[key];
          return (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, borderBottomWidth: i === order.length - 1 ? 0 : 2, borderBottomColor: colors.border }}>
              <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={RICON[key]} size={18} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="title">{copy.label}</AppText>
                {r.enabled && <TimeStepper time={r.time} dim={false} onChange={(t) => setReminder(key, { time: t })} />}
              </View>
              <Pressable onPress={() => setReminder(key, { enabled: !r.enabled })} accessibilityRole="switch" accessibilityLabel={copy.label} accessibilityState={{ checked: r.enabled }} hitSlop={8}>
                <Toggle on={r.enabled} />
              </Pressable>
            </View>
          );
        })}
      </Group>

      <Group title="HYDRATION">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12 }}>
          <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="droplet" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="title">Drink water</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {hydration.enabled ? `Every ${hydration.everyHours}h · ${fmt(`${hydration.startHour}:00`)}-${fmt(`${hydration.endHour}:00`)}` : 'Repeating reminders across the day'}
            </AppText>
          </View>
          <Pressable onPress={() => setHydration({ enabled: !hydration.enabled })} accessibilityRole="switch" accessibilityLabel="Drink water" accessibilityState={{ checked: hydration.enabled }} hitSlop={8}>
            <Toggle on={hydration.enabled} />
          </Pressable>
        </View>
        {hydration.enabled && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 2, borderTopColor: colors.border }}>
            <AppText variant="body" color={colors.textSecondary}>How often</AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3].map((h) => (
                <Pressable key={h} onPress={() => setHydration({ everyHours: h })} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 99, backgroundColor: hydration.everyHours === h ? colors.accent : colors.navBg }}>
                  <AppText variant="caption" color={hydration.everyHours === h ? colors.accentInk : colors.ink}>{h}h</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Group>
    </Screen>
  );
}
