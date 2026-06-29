import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText, Button, Screen } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { MoveViz } from '../src/components/MoveViz';
import { useWorkouts } from '../src/store/workouts';
import { useHealth } from '../src/store/health';
import {
  EXERCISES,
  bestE1rm,
  computeReadiness,
  progressionIncrement,
  repRange,
  restRecommendation,
  suggestProgression,
  volume,
  type Exercise,
  type SetEntry,
} from '../src/data/workouts';
import { programByKey, restSeconds } from '../src/data/programs';
import { Icon } from '../src/components/Icon';

const MUSCLE_LABEL: Record<string, string> = { chest: 'Chest', back: 'Back', legs: 'Legs', shoulders: 'Shoulders', arms: 'Arms', core: 'Core', glutes: 'Glutes' };

function Stepper({ label, value, unit, onStep, dim }: { label: string; value: number; unit: string; onStep: (d: number) => void; dim?: boolean }) {
  const { colors } = useTheme();
  const Btn = ({ t, d }: { t: string; d: number }) => (
    <Pressable onPress={() => onStep(d)} hitSlop={6} style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={t === '+' ? 'plus' : 'minus'} size={18} color={colors.textSecondary} />
    </Pressable>
  );
  return (
    <View style={{ flex: 1, gap: 6, opacity: dim ? 0.5 : 1 }}>
      <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Btn t="-" d={-1} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="h1">{value}</AppText>
          <AppText variant="caption" color={colors.textMuted}>{unit}</AppText>
        </View>
        <Btn t="+" d={1} />
      </View>
    </View>
  );
}

export default function Session() {
  const { colors } = useTheme();
  const router = useRouter();
  const { program } = useLocalSearchParams<{ program?: string }>();
  const { addSession, lastFor } = useWorkouts();
  const { summary } = useHealth();

  const prog = programByKey(program ?? 'fullbody');
  const exercises = useMemo<Exercise[]>(
    () => (prog?.exKeys ?? []).map((k) => EXERCISES.find((e) => e.key === k)).filter((e): e is Exercise => !!e),
    [prog],
  );

  const [idx, setIdx] = useState(0);
  const [logged, setLogged] = useState<SetEntry[][]>(() => exercises.map(() => []));
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(8);
  const [rest, setRest] = useState<{ left: number; total: number } | null>(null);

  const ex = exercises[idx];
  const isBodyweight = ex?.equipment === 'bodyweight';
  const isTimed = ex?.key === 'plank'; // measured in seconds, not reps
  const repUnit = isTimed ? 'sec' : 'reps';
  const incr = ex ? progressionIncrement(ex.muscle, ex.key) : 2.5;

  // Suggested target for the current exercise (from history via double-progression, else a sane default).
  const target = useMemo(() => {
    if (!ex) return { weight: 0, reps: 8 };
    const rr = repRange(ex.equipment);
    const last = lastFor(ex.key);
    const tgt = last?.sets?.length ? suggestProgression(last.sets, incr, rr.floor, rr.ceil) : null;
    const w = tgt?.weight ?? (isBodyweight ? 0 : ex.equipment === 'barbell' ? 40 : 20);
    return { weight: w, reps: tgt?.reps ?? (isTimed ? 45 : rr.floor) };
  }, [ex, lastFor, incr, isBodyweight, isTimed]);

  // Reset the draft to the target on a new exercise, and re-sync if the target itself
  // changes (e.g. history finishes loading from storage just after mount).
  useEffect(() => {
    setWeight(target.weight);
    setReps(target.reps);
  }, [ex?.key, target.weight, target.reps]);

  // Rest countdown.
  useEffect(() => {
    if (!rest) return;
    if (rest.left <= 0) { setRest(null); return; }
    const t = setTimeout(() => setRest((r) => (r ? { ...r, left: r.left - 1 } : null)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  if (!ex) {
    return (
      <Screen>
        <AppText variant="h2">No program selected</AppText>
        <Button label="Back" variant="line" onPress={() => router.back()} />
      </Screen>
    );
  }

  const sets = logged[idx];
  const logSet = () => {
    if (reps <= 0 || (!isBodyweight && weight <= 0)) return; // a loaded lift needs a weight
    setLogged((all) => all.map((s, i) => (i === idx ? [...s, { weight, reps }] : s)));
    setRest({ left: restSeconds(reps), total: restSeconds(reps) });
  };
  const undoSet = () => setLogged((all) => all.map((s, i) => (i === idx ? s.slice(0, -1) : s)));

  const last = idx === exercises.length - 1;
  const finish = () => {
    const r = computeReadiness(summary ?? null);
    exercises.forEach((e, i) => {
      const s = logged[i];
      if (!s.length) return;
      addSession({ kind: 'gym', exKey: e.key, sets: s, volume: volume(s), e1rm: bestE1rm(s), readiness: r });
    });
    router.replace('/workout-history');
  };
  const next = () => { if (rest) setRest(null); last ? finish() : setIdx((i) => i + 1); };

  const restPct = rest ? rest.left / rest.total : 0;
  const totalDone = logged.reduce((n, s) => n + s.length, 0);

  return (
    <Screen>
      {/* header: progress + close */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={20} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{prog?.name}</AppText>
          <AppText variant="caption" color={colors.textMuted}>Exercise {idx + 1} of {exercises.length} · {totalDone} sets logged</AppText>
        </View>
      </View>

      {/* progress dots */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {exercises.map((e, i) => (
          <View key={e.key} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: i < idx || (i === idx && sets.length) ? colors.accent : i === idx ? colors.textMuted : colors.border }} />
        ))}
      </View>

      {/* current exercise */}
      <View style={{ backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ backgroundColor: colors.navBg, borderRadius: radii.lg, padding: 4 }}>
            <MoveViz kind={ex.key} emoji={ex.emoji} size={84} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h2">{ex.name}</AppText>
            <AppText variant="caption" color={colors.textMuted}>{MUSCLE_LABEL[ex.muscle]} · {ex.equipment}</AppText>
            <AppText variant="caption" color={colors.accentText} style={{ marginTop: 4 }}>
              Target {isBodyweight ? `${target.reps} ${repUnit}` : `${target.weight} kg × ${target.reps}`}
            </AppText>
          </View>
        </View>

        {/* logged sets */}
        {sets.length > 0 && (
          <View style={{ gap: 4 }}>
            {sets.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <AppText variant="caption" color={colors.accentInk}>{i + 1}</AppText>
                </View>
                <AppText variant="body" color={colors.textSecondary}>{isBodyweight ? `${s.reps} ${repUnit}` : `${s.weight} kg × ${s.reps}`}</AppText>
              </View>
            ))}
            <Pressable onPress={undoSet} hitSlop={6}><AppText variant="caption" color={colors.textMuted}>Undo last set</AppText></Pressable>
          </View>
        )}

        {/* rest timer OR set entry */}
        {rest ? (
          <View style={{ backgroundColor: colors.navBg, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>REST</AppText>
              <AppText variant="metric" color={colors.accentText}>{Math.floor(rest.left / 60)}:{String(rest.left % 60).padStart(2, '0')}</AppText>
            </View>
            <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.border, overflow: 'hidden' }}>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.accent, width: `${restPct * 100}%` }} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button label="+30s" variant="line" style={{ flex: 1 }} onPress={() => setRest((r) => (r ? { left: r.left + 30, total: r.total + 30 } : null))} />
              <Button label="Skip rest" variant="dark" style={{ flex: 1 }} onPress={() => setRest(null)} />
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Stepper label="WEIGHT" value={weight} unit="kg" dim={isBodyweight} onStep={(d) => setWeight((w) => Math.max(0, +(w + d * incr).toFixed(2)))} />
              <Stepper label={ex.key === 'plank' ? 'SECONDS' : 'REPS'} value={reps} unit={ex.key === 'plank' ? 'sec' : 'reps'} onStep={(d) => setReps((r) => Math.max(1, r + d))} />
            </View>
            <Button label={`Log set ${sets.length + 1}`} onPress={logSet} />
            <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>⏱ Suggested rest: {restRecommendation(reps)}</AppText>
          </View>
        )}
      </View>

      <Button label={last ? `Finish & save (${totalDone} sets)` : 'Next exercise ›'} variant={last ? 'solid' : 'dark'} onPress={next} />
      {!last && <Pressable onPress={finish} style={{ alignItems: 'center' }}><AppText variant="caption" color={colors.textMuted}>Finish early & save</AppText></Pressable>}
    </Screen>
  );
}
