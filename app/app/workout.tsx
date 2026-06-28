import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen, SectionHeader } from '../src/design-system/components';
import { Sparkline } from '../src/components/Charts';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { useHealth } from '../src/store/health';
import { useWorkouts } from '../src/store/workouts';
import { useAppState } from '../src/store/app';
import { DEMO_SUMMARY } from '../src/integrations/demo';
import {
  EXERCISES,
  SPORTS,
  MUSCLE_LABEL,
  adjustForReadiness,
  computeReadiness,
  bestE1rm,
  distanceKm,
  e1rm,
  metCalories,
  platesPerSide,
  warmupRamp,
  runningMet,
  totalReps,
  volume,
  workingWeight,
  type SetEntry,
} from '../src/data/workouts';

const SEED_SETS: SetEntry[] = [
  { weight: 60, reps: 10 },
  { weight: 70, reps: 8 },
  { weight: 75, reps: 6 },
];

export default function Workout() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { summary } = useHealth();
  const { addSession, lastFor, bestE1rmFor, e1rmTrendFor, sessions } = useWorkouts();
  const { body } = useAppState();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);

  const [detailed, setDetailed] = useState(false);
  const [mode, setMode] = useState<'gym' | 'sports'>('gym');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [barKg, setBarKg] = useState(20);

  // gym state
  const [exKey, setExKey] = useState(EXERCISES[0].key);
  const [sets, setSets] = useState<SetEntry[]>(SEED_SETS);
  const ex = EXERCISES.find((e) => e.key === exKey) ?? EXERCISES[0];

  // sports state
  const [sportKey, setSportKey] = useState(SPORTS[0].key);
  const [minutes, setMinutes] = useState(45);
  const [pace, setPace] = useState(6); // min/km, for GPS sports
  // Derive from the (async-loaded) body profile live; only snapshot once the user overrides.
  const [weightOverride, setWeightOverride] = useState<number | null>(null);
  const weight = weightOverride ?? body.weightKg;
  const sport = SPORTS.find((sp) => sp.key === sportKey) ?? SPORTS[0];

  const r = computeReadiness(s);
  const advice = adjustForReadiness(r);
  const adviceBg =
    advice.tone === 'rest' ? tiles.pink : advice.tone === 'easy' ? tiles.gold : advice.tone === 'push' ? tiles.mint : tiles.blue;

  const vol = useMemo(() => volume(sets), [sets]);
  const best = useMemo(() => bestE1rm(sets), [sets]);
  const topWeight = sets.reduce((m, st) => Math.max(m, st.weight), 0);
  const plates = platesPerSide(topWeight, barKg);
  const loaded = barKg + plates.reduce((a, b) => a + b, 0) * 2; // what the plates actually make
  const warmup = warmupRamp(topWeight, ex.equipment === 'barbell' ? barKg : 0);
  const suggested = workingWeight(best || 80, 8, advice.factor);

  const last = lastFor(exKey);
  const trend = e1rmTrendFor(exKey);
  const prevBest = bestE1rmFor(exKey);
  const isPr = best > prevBest; // strict: ties aren't PRs

  const save = () => {
    const wasPr = mode === 'gym' && best > prevBest;
    if (mode === 'gym') addSession({ kind: 'gym', exKey, sets, volume: vol, e1rm: best, readiness: r });
    else addSession({ kind: 'sport', sportKey, minutes, kcal: cals, distanceKm: dist, readiness: r });
    // Stay on the screen so the user SEES the payoff: updated best, ticked-up trend.
    setSavedMsg(mode === 'gym' ? (wasPr ? 'Saved — new e1RM PR 💪' : 'Saved ✓') : `Logged ${sport.name} ✓`);
  };

  const sportMet = sport.key === 'running' ? runningMet(pace) : sport.met;
  const cals = metCalories(sportMet, minutes, weight);
  const dist = sport.gps ? distanceKm(minutes, pace) : 0;

  const setVal = (i: number, field: keyof SetEntry, delta: number) => {
    setSavedMsg(null);
    setSets((arr) => arr.map((st, j) => (j === i ? { ...st, [field]: Math.max(0, st[field] + delta) } : st)));
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: 18 }}>‹</AppText>
        </Pressable>
        <AppText variant="h1" style={{ flex: 1 }}>Workout</AppText>
        <Pressable onPress={() => router.navigate('/workout-history')} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }}>
          <AppText style={{ fontSize: 16 }}>📈</AppText>
        </Pressable>
        <Pressable
          onPress={() => setDetailed((d) => !d)}
          style={{ flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: 99, padding: 4 }}
        >
          {(['Simple', 'Detailed'] as const).map((t, i) => {
            const on = detailed === (i === 1);
            return (
              <View key={t} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 99, backgroundColor: on ? colors.navOn : 'transparent' }}>
                <AppText variant="caption" color={on ? colors.navOnText : colors.textMuted} style={{ fontSize: 11 }}>{t}</AppText>
              </View>
            );
          })}
        </Pressable>
      </View>

      {/* readiness-adjusted recommendation — the differentiator */}
      <View style={{ backgroundColor: adviceBg.bg, borderRadius: radii.xl, padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="caption" color={adviceBg.ink} style={{ letterSpacing: 1.2 }}>TODAY · READINESS {r}</AppText>
          <AppText variant="h2" color={adviceBg.ink}>{advice.label}</AppText>
        </View>
        <AppText variant="caption" color={adviceBg.ink} style={{ fontWeight: '600', marginTop: 5, lineHeight: 18 }}>{advice.note}</AppText>
        {detailed && (
          <AppText variant="caption" color={adviceBg.ink} style={{ marginTop: 7, opacity: 0.85 }}>
            Load factor ×{advice.factor.toFixed(2)} · suggested top set ≈ {suggested} kg × 8 (from your {Math.round(best)} kg e1RM)
          </AppText>
        )}
      </View>

      {/* mode switch */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: 99, padding: 4 }}>
        {(['gym', 'sports'] as const).map((m) => (
          <Pressable key={m} onPress={() => { setMode(m); setSavedMsg(null); }} style={{ flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 99, backgroundColor: mode === m ? colors.navOn : 'transparent' }}>
            <AppText variant="caption" color={mode === m ? colors.navOnText : colors.textMuted}>{m === 'gym' ? '🏋️ Gym' : '🎾 Sports'}</AppText>
          </Pressable>
        ))}
      </View>

      {mode === 'gym' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {EXERCISES.map((e) => {
              const on = e.key === exKey;
              return (
                <Pressable key={e.key} onPress={() => { setExKey(e.key); setSavedMsg(null); }} style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 99, backgroundColor: on ? colors.accent : colors.card, borderWidth: 2, borderColor: on ? colors.accent : colors.border }}>
                  <AppText variant="caption" color={on ? '#fff' : colors.ink}>{e.emoji} {e.name}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          <Card>
            {detailed && (
              <AppText variant="caption" color={colors.textMuted}>
                {MUSCLE_LABEL[ex.muscle]} · {ex.equipment}
              </AppText>
            )}
            {sets.map((st, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: colors.border }}>
                <AppText variant="caption" color={colors.textMuted} style={{ width: 22 }}>{i + 1}</AppText>
                <Stepper label="kg" value={st.weight} onMinus={() => setVal(i, 'weight', -2.5)} onPlus={() => setVal(i, 'weight', 2.5)} colors={colors} />
                <Stepper label="reps" value={st.reps} onMinus={() => setVal(i, 'reps', -1)} onPlus={() => setVal(i, 'reps', 1)} colors={colors} />
                {detailed && (
                  <AppText variant="caption" color={colors.accentText} style={{ marginLeft: 'auto' }}>
                    {e1rm(st.weight, st.reps)} 1RM
                  </AppText>
                )}
              </View>
            ))}
            <Pressable onPress={() => setSets((a) => [...a, { ...(a[a.length - 1] ?? { weight: 40, reps: 8 }) }])} style={{ paddingVertical: 10 }}>
              <AppText variant="caption" color={colors.accentText}>＋ Add set</AppText>
            </Pressable>
            {detailed && ex.equipment === 'barbell' && (
              <View style={{ paddingBottom: 8, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AppText variant="caption" color={colors.textMuted}>Bar</AppText>
                  <View style={{ flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: 99, padding: 3 }}>
                    {[20, 15, 25].map((b) => {
                      const on = barKg === b;
                      return (
                        <Pressable key={b} onPress={() => setBarKg(b)} style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 99, backgroundColor: on ? colors.navOn : 'transparent' }}>
                          <AppText variant="caption" color={on ? colors.navOnText : colors.textMuted} style={{ fontSize: 10 }}>{b}kg</AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  🏋️ Per side @ {topWeight} kg: {plates.length ? plates.join(' · ') : 'just the bar'}{loaded !== topWeight ? ` (≈ ${loaded} kg loadable)` : ''}
                </AppText>
              </View>
            )}
            {detailed && warmup.length > 0 && (
              <AppText variant="caption" color={colors.textMuted} style={{ paddingBottom: 8 }}>
                🔥 Warm-up: {warmup.map((w) => `${w.weight}×${w.reps}`).join(' · ')}
              </AppText>
            )}
          </Card>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Stat label="VOLUME" value={`${vol.toLocaleString()}`} unit="kg" color={tiles.lav} />
            <Stat label="EST 1RM" value={`${Math.round(best)}`} unit="kg" color={tiles.peach} />
            {detailed && <Stat label="REPS" value={`${totalReps(sets)}`} unit="" color={tiles.mint} />}
          </View>

          {(last || trend.length > 1) && (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>
                    PROGRESSION
                  </AppText>
                  <AppText variant="title" style={{ marginTop: 2 }}>
                    best {Math.round(prevBest)} kg{isPr ? '  ·  🏆 PR today' : ''}
                  </AppText>
                  {!!last && (
                    <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                      last {last.at.slice(5, 10)}: {(last.sets ?? []).map((st) => `${st.weight}×${st.reps}`).join(' · ')}
                    </AppText>
                  )}
                </View>
                {trend.length > 1 && <Sparkline data={trend} color={colors.accentText} />}
              </View>
            </Card>
          )}
        </>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {SPORTS.map((sp) => {
              const on = sp.key === sportKey;
              return (
                <Pressable key={sp.key} onPress={() => { setSportKey(sp.key); setSavedMsg(null); }} style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 99, backgroundColor: on ? colors.accent : colors.card, borderWidth: 2, borderColor: on ? colors.accent : colors.border }}>
                  <AppText variant="caption" color={on ? '#fff' : colors.ink}>{sp.emoji} {sp.name}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="title">{sport.emoji} {sport.name}</AppText>
              <Stepper label="min" value={minutes} onMinus={() => setMinutes((m) => Math.max(5, m - 5))} onPlus={() => setMinutes((m) => m + 5)} colors={colors} />
            </View>
            {sport.gps && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 }}>
                <AppText variant="caption" color={colors.textMuted}>Pace</AppText>
                <Stepper label="min/km" value={pace} onMinus={() => setPace((p) => Math.max(3, p - 1))} onPlus={() => setPace((p) => p + 1)} colors={colors} />
              </View>
            )}
            {detailed && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 }}>
                <AppText variant="caption" color={colors.textMuted}>Your weight</AppText>
                <Stepper label="kg" value={weight} onMinus={() => setWeightOverride(Math.max(35, weight - 1))} onPlus={() => setWeightOverride(weight + 1)} colors={colors} />
              </View>
            )}
          </Card>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Stat label="CALORIES" value={`${cals}`} unit="kcal" color={tiles.pink} />
            {sport.gps && <Stat label="DISTANCE" value={`${dist}`} unit="km" color={tiles.blue} />}
            {detailed && <Stat label="MET" value={`${Math.round(sportMet * 10) / 10}`} unit="" color={tiles.gold} />}
          </View>
          {detailed && (
            <AppText variant="caption" color={colors.textMuted}>
              {Math.round((cals / minutes) * 10) / 10} kcal/min · kcal = MET {Math.round(sportMet * 10) / 10} × {weight} kg × {(minutes / 60).toFixed(2)} h{sport.key === 'running' ? ` · ${pace}:00/km` : ''}
            </AppText>
          )}
        </>
      )}

      {sessions.length > 0 && (
        <View>
          <SectionHeader title="Recent" />
          {[...sessions].slice(-5).reverse().map((ws) => {
            const title = ws.kind === 'gym'
              ? `${EXERCISES.find((e) => e.key === ws.exKey)?.name ?? 'Lift'} · ${(ws.volume ?? 0).toLocaleString()} kg`
              : `${SPORTS.find((sp) => sp.key === ws.sportKey)?.name ?? 'Sport'} · ${ws.kcal ?? 0} kcal`;
            return (
              <View key={ws.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: colors.border }}>
                <AppText variant="caption" color={colors.ink}>{ws.kind === 'gym' ? '🏋️' : '🎾'} {title}</AppText>
                <AppText variant="caption" color={colors.textMuted}>{ws.at.slice(5, 10)}</AppText>
              </View>
            );
          })}
        </View>
      )}

      {savedMsg && (
        <View style={{ backgroundColor: tiles.mint.bg, borderRadius: radii.lg, padding: spacing.md, alignItems: 'center' }}>
          <AppText variant="title" color={tiles.mint.ink}>{savedMsg}</AppText>
        </View>
      )}
      <Button label={mode === 'gym' ? `Save workout · ${vol.toLocaleString()} kg volume` : `Log ${sport.name} · ${cals} kcal`} onPress={save} />
    </Screen>
  );
}

function Stepper({ label, value, onMinus, onPlus, colors }: { label: string; value: number; onMinus: () => void; onPlus: () => void; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Pressable onPress={onMinus} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
        <AppText style={{ fontSize: 16 }}>−</AppText>
      </Pressable>
      <View style={{ minWidth: 52, alignItems: 'center' }}>
        <AppText variant="title">{value}</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 9 }}>{label}</AppText>
      </View>
      <Pressable onPress={onPlus} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
        <AppText style={{ fontSize: 16 }}>＋</AppText>
      </Pressable>
    </View>
  );
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color: { bg: string; ink: string } }) {
  return (
    <View style={{ flex: 1, backgroundColor: color.bg, borderRadius: radii.xl, padding: spacing.lg }}>
      <AppText variant="caption" color={color.ink} style={{ letterSpacing: 1.2 }}>{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 4 }}>
        <AppText variant="h2">{value}</AppText>
        {!!unit && <AppText variant="caption" color={color.ink} style={{ marginBottom: 4 }}>{unit}</AppText>}
      </View>
    </View>
  );
}
