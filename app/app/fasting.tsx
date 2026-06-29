import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { AppText, Button, Card, Screen } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { useAppState } from '../src/store/app';
import { useFasting } from '../src/store/fasting';
import { PLANS, RAMADAN_PLAN, fastingState, fmtCountdown, planByKey } from '../src/data/fasting';
import { cancelScheduled, scheduleAt } from '../src/services/notifications';

const RING = 248;
const STROKE = 20;

function Ring({ progress, color, track }: { progress: number; color: string; track: string }) {
  const rect = { x: STROKE / 2, y: STROKE / 2, width: RING - STROKE, height: RING - STROKE };
  const bg = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(rect, 0, 360);
    return p;
  }, []);
  const fg = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(rect, -90, Math.max(0.01, Math.min(1, progress)) * 360);
    return p;
  }, [progress]);
  return (
    <Canvas style={{ width: RING, height: RING }}>
      <Path path={bg} style="stroke" strokeWidth={STROKE} color={track} strokeCap="round" />
      <Path path={fg} style="stroke" strokeWidth={STROKE} color={color} strokeCap="round" antiAlias />
    </Canvas>
  );
}

function clock12(ms: number): string {
  const d = new Date(ms);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

export default function Fasting() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { ramadan } = useAppState();
  const { planKey, startedAt, setPlan, start, stop } = useFasting();

  const [, force] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifId = useRef<string | null>(null);

  const active = planKey === 'ramadan' || startedAt !== null;

  useEffect(() => {
    if (!active) return;
    tick.current = setInterval(() => force((n) => n + 1), 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [active]);

  const st = fastingState(planKey, startedAt);
  const fasting = st.phase === 'fasting';
  // `accent` and `accentText` are identical in light mode; in dark mode accentText is the
  // lighter green that stays legible as TEXT, so use it for text and the deeper accent for
  // the ring stroke (a non-text graphic).
  const phaseColor = fasting ? colors.accentText : tiles.gold.ink;
  const ringColor = fasting ? colors.accent : tiles.gold.ink;
  const phaseTint = fasting ? tiles.mint.bg : tiles.gold.bg;

  // (Re)schedule the boundary nudge whenever the phase flips while active, and cancel any
  // stale one when the timer stops, so a session gets an alert at every transition, not
  // just the first.
  useEffect(() => {
    if (!active) {
      cancelScheduled(notifId.current);
      notifId.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      await cancelScheduled(notifId.current);
      const flipsToEat = st.phase === 'fasting';
      const id = await scheduleAt(
        new Date(st.endsAt),
        flipsToEat ? 'Fasting window complete' : 'Eating window over',
        flipsToEat ? 'Nicely done, your eating window is open.' : 'Time to start your fast. You’ve got this.',
      );
      if (!cancelled) notifId.current = id;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, st.phase, planKey]);

  const begin = (key: string) => start(key);

  return (
    <Screen scroll={!active}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Fasting</AppText>
      </View>

      {active ? (
        <>
          <View style={{ alignItems: 'center', justifyContent: 'center', height: RING + 8 }}>
            <Ring progress={st.progress} color={ringColor} track={colors.navBg} />
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={fasting ? 'moon' : 'utensils'} size={16} color={phaseColor} />
                <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>{fasting ? 'FASTING' : 'EATING WINDOW'}</AppText>
              </View>
              <AppText variant="metric" style={{ fontSize: 46, lineHeight: 52 }} color={phaseColor}>{fmtCountdown(st.secondsLeft)}</AppText>
              <AppText variant="caption" color={colors.textMuted}>{fasting ? 'until your eating window' : 'until your next fast'}</AppText>
            </View>
          </View>

          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: phaseTint, borderColor: phaseTint }}>
            <Icon name={planKey === 'ramadan' ? 'moon-star' : 'timer'} size={20} color={phaseColor} />
            <View style={{ flex: 1 }}>
              <AppText variant="title" color={phaseColor}>{planByKey(planKey).name}{planKey !== 'ramadan' ? ' plan' : ''}</AppText>
              <AppText variant="caption" color={phaseColor} style={{ opacity: 0.9 }}>{fasting ? 'Eat at' : 'Fast at'} {clock12(st.endsAt)} · {Math.round((st.progress) * 100)}% through</AppText>
            </View>
          </Card>

          <Button label={planKey === 'ramadan' ? 'Stop following Ramadan' : 'End fast'} variant="line" onPress={stop} />
        </>
      ) : (
        <>
          <AppText variant="body" color={colors.textSecondary}>
            Pick an eating window and Nabdh tracks your fast with a live countdown and a nudge when it’s time to eat, or follow the Ramadan rhythm, set by Fajr and Maghrib.
          </AppText>

          {ramadan && (
            <Pressable onPress={() => begin('ramadan')} style={{ backgroundColor: tiles.lav.bg, borderRadius: radii.xl, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="moon-star" size={22} color={tiles.lav.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title" color={tiles.lav.ink}>Follow Ramadan</AppText>
                <AppText variant="caption" color={tiles.lav.ink} style={{ opacity: 0.9 }}>{RAMADAN_PLAN.note}</AppText>
                <AppText variant="caption" color={tiles.lav.ink} style={{ opacity: 0.7, marginTop: 2 }}>Demo times · Riyadh</AppText>
              </View>
              <Icon name="chevron-right" size={18} color={tiles.lav.ink} />
            </Pressable>
          )}

          <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginLeft: 4 }}>CHOOSE A WINDOW</AppText>
          {PLANS.map((p) => {
            const sel = p.key === planKey;
            return (
              <Pressable key={p.key} onPress={() => setPlan(p.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderWidth: sel ? 2 : 1, borderColor: sel ? colors.accent : colors.border, borderRadius: radii.lg, padding: spacing.md }}>
                <View style={{ width: 52, alignItems: 'center' }}>
                  <AppText variant="metric" style={{ fontSize: 17, lineHeight: 20 }} color={sel ? colors.accentText : colors.ink}>{p.name}</AppText>
                </View>
                <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1, lineHeight: 17 }}>{p.note}</AppText>
                {sel && <Icon name="check" size={18} color={colors.accent} />}
              </Pressable>
            );
          })}

          <Button label="Start fast" onPress={() => begin(planKey === 'ramadan' ? '16:8' : planKey)} />
        </>
      )}
    </Screen>
  );
}
