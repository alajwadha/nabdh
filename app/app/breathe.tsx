import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText, Button, Screen, SegmentedControl } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { useMindful } from '../src/store/mindful';
import { PATTERNS, DURATIONS, patternByKey, cycleSecs, type BreathStep } from '../src/data/breath';

const RING = 230;

export default function Breathe() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { addSession, streak, totalMinutes } = useMindful();

  const [patternKey, setPatternKey] = useState('box');
  const [mins, setMins] = useState<number>(3);
  const pattern = patternByKey(patternKey);

  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [secLeft, setSecLeft] = useState(0);
  const [totalLeft, setTotalLeft] = useState(0);
  const [loggedMins, setLoggedMins] = useState(0);

  const scale = useSharedValue(0.5);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const lastIdxRef = useRef(-1);

  const animatePhase = (step: BreathStep) => {
    if (reduced) return;
    const target = step.kind === 'inhale' ? 1 : step.kind === 'exhale' ? 0.42 : undefined; // hold keeps scale
    if (target !== undefined) scale.value = withTiming(target, { duration: step.secs * 1000, easing: Easing.inOut(Easing.quad) });
  };

  const clear = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  // Record a finished/ended session of `secs` actual seconds, if it's worth
  // keeping (>= ~1 min). Returns whether anything was logged.
  const record = (secs: number): boolean => {
    const m = Math.round(secs / 60);
    if (m < 1) return false;
    addSession(m, pattern.key);
    setLoggedMins(m);
    return true;
  };

  const stop = () => {
    clear();
    setActive(false);
    // Ending early still counts the time you actually breathed.
    setDone(record(Math.floor((Date.now() - startRef.current) / 1000)));
    scale.value = withTiming(0.5, { duration: 500 });
  };

  const finish = (secs: number) => {
    clear();
    setActive(false);
    record(secs);
    setDone(true);
    scale.value = withTiming(0.5, { duration: 500 });
  };

  const start = () => {
    const steps = pattern.steps;
    const cyc = cycleSecs(pattern);
    const totalSecs = mins * 60;
    setDone(false);
    setLoggedMins(0);
    setStepIdx(0);
    lastIdxRef.current = -1;
    setSecLeft(steps[0].secs);
    setTotalLeft(totalSecs);
    setActive(true);
    startRef.current = Date.now();

    // Everything is derived from wall-clock elapsed time: the countdown can't
    // drift, and if the app is backgrounded the next tick simply recomputes
    // from the clock and catches up. No side effects inside state updaters.
    const apply = (elapsed: number) => {
      let pos = elapsed % cyc;
      let idx = 0;
      for (let i = 0; i < steps.length; i++) {
        if (pos < steps[i].secs) {
          idx = i;
          break;
        }
        pos -= steps[i].secs;
      }
      setStepIdx(idx);
      setSecLeft(steps[idx].secs - pos);
      setTotalLeft(Math.max(0, totalSecs - elapsed));
      if (idx !== lastIdxRef.current) {
        lastIdxRef.current = idx;
        animatePhase(steps[idx]);
      }
    };
    apply(0);
    timer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      if (elapsed >= totalSecs) {
        finish(totalSecs);
        return;
      }
      apply(elapsed);
    }, 1000);
  };

  const ring = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const curStep = pattern.steps[stepIdx];
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <Screen scroll={!active}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel={active ? 'Stop' : 'Back'} hitSlop={8} onPress={() => (active ? stop() : router.back())} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={active ? 'x' : 'chevron-left'} size={active ? 20 : 22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Breathe</AppText>
      </View>

      {/* the breathing circle */}
      <View style={{ alignItems: 'center', justifyContent: 'center', height: RING + 30, marginTop: spacing.sm }}>
        <View style={{ position: 'absolute', width: RING, height: RING, borderRadius: 999, backgroundColor: tiles.blue.bg, opacity: 0.4 }} />
        <Animated.View style={[{ width: RING, height: RING, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, ring]} />
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          {active || done ? (
            <>
              {done ? <Icon name="check" size={52} color="#fff" stroke={2.5} /> : <AppText variant="metric" color="#fff" style={{ fontSize: 56, lineHeight: 60 }}>{secLeft}</AppText>}
              <AppText variant="title" color="rgba(255,255,255,0.95)">{done ? 'Done' : curStep.label}</AppText>
            </>
          ) : (
            <>
              <Icon name="wind" size={34} color="#fff" />
              <AppText variant="title" color="rgba(255,255,255,0.95)" style={{ marginTop: 6 }}>{pattern.name}</AppText>
            </>
          )}
        </View>
      </View>

      {active ? (
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <AppText variant="caption" color={colors.textMuted}>{mmss(totalLeft)} left · {pattern.name}</AppText>
          <Button label="End session" variant="line" style={{ alignSelf: 'stretch' }} onPress={stop} />
        </View>
      ) : (
        <>
          {done && (
            <View style={{ backgroundColor: tiles.mint.bg, borderRadius: radii.lg, padding: spacing.lg }}>
              <AppText variant="title" color={tiles.mint.ink}>Nice work, {loggedMins} min done</AppText>
              <AppText variant="caption" color={tiles.mint.ink} style={{ marginTop: 2 }}>{streak}-day streak · {totalMinutes} min total</AppText>
            </View>
          )}
          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2, marginLeft: 4 }}>PATTERN</AppText>
            {PATTERNS.map((p) => {
              const sel = p.key === patternKey;
              return (
                <Pressable key={p.key} onPress={() => setPatternKey(p.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderWidth: sel ? 2 : 1, borderColor: sel ? colors.accent : colors.border, borderRadius: radii.lg, padding: spacing.md }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: sel ? colors.accent : colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="wind" size={18} color={sel ? colors.accentInk : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="title">{p.name}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>{p.note}</AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <SegmentedControl
            value={String(mins)}
            onChange={(v) => setMins(Number(v))}
            options={DURATIONS.map((d) => ({ value: String(d), label: `${d} min` }))}
          />

          <Button label="Start" onPress={start} />
          {reduced && <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>Reduced motion is on, the circle stays still; follow the phase labels.</AppText>}
        </>
      )}
    </Screen>
  );
}
