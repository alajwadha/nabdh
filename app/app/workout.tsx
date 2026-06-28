import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { HealthDaily } from '@nabdh/shared';
import { AppText, Button, Card, Screen } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { useHealth } from '../src/store/health';
import { DEMO_SUMMARY } from '../src/integrations/demo';
import {
  EXERCISES,
  SPORTS,
  MUSCLE_LABEL,
  DEFAULT_WEIGHT_KG,
  adjustForReadiness,
  bestE1rm,
  distanceKm,
  e1rm,
  metCalories,
  totalReps,
  volume,
  workingWeight,
  type SetEntry,
} from '../src/data/workouts';

function readiness(s: HealthDaily | null): number {
  if (!s) return 64;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  let score = 0;
  let w = 0;
  if (s.sleepMinutes != null) { score += clamp(s.sleepMinutes / 450) * 40; w += 40; }
  if (s.restingHeartRate != null) { score += clamp((70 - s.restingHeartRate) / 16) * 30; w += 30; }
  if (s.hrvSdnn != null) { score += clamp(s.hrvSdnn / 70) * 30; w += 30; }
  return w === 0 ? 64 : Math.round((score / w) * 100);
}

const SEED_SETS: SetEntry[] = [
  { weight: 60, reps: 10 },
  { weight: 70, reps: 8 },
  { weight: 75, reps: 6 },
];

export default function Workout() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { summary } = useHealth();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);

  const [detailed, setDetailed] = useState(false);
  const [mode, setMode] = useState<'gym' | 'sports'>('gym');

  // gym state
  const [exKey, setExKey] = useState(EXERCISES[0].key);
  const [sets, setSets] = useState<SetEntry[]>(SEED_SETS);
  const ex = EXERCISES.find((e) => e.key === exKey)!;

  // sports state
  const [sportKey, setSportKey] = useState(SPORTS[0].key);
  const [minutes, setMinutes] = useState(45);
  const sport = SPORTS.find((sp) => sp.key === sportKey)!;

  const r = readiness(s);
  const advice = adjustForReadiness(r);
  const adviceBg =
    advice.tone === 'rest' ? tiles.pink : advice.tone === 'easy' ? tiles.gold : advice.tone === 'push' ? tiles.mint : tiles.blue;

  const vol = useMemo(() => volume(sets), [sets]);
  const best = useMemo(() => bestE1rm(sets), [sets]);
  const suggested = workingWeight(best || 80, 8, advice.factor);

  const cals = metCalories(sport.met, minutes, DEFAULT_WEIGHT_KG);
  const dist = sport.gps ? distanceKm(minutes, sportKey === 'walking' ? 11 : sportKey === 'cycling' ? 3 : 6) : 0;

  const setVal = (i: number, field: keyof SetEntry, delta: number) =>
    setSets((arr) => arr.map((st, j) => (j === i ? { ...st, [field]: Math.max(0, st[field] + delta) } : st)));

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: 18 }}>‹</AppText>
        </Pressable>
        <AppText variant="h1" style={{ flex: 1 }}>Workout</AppText>
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
          <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 99, backgroundColor: mode === m ? colors.navOn : 'transparent' }}>
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
                <Pressable key={e.key} onPress={() => setExKey(e.key)} style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 99, backgroundColor: on ? colors.accent : colors.card, borderWidth: 2, borderColor: on ? colors.accent : colors.border }}>
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
          </Card>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Stat label="VOLUME" value={`${vol.toLocaleString()}`} unit="kg" color={tiles.lav} />
            <Stat label="EST 1RM" value={`${Math.round(best)}`} unit="kg" color={tiles.peach} />
            {detailed && <Stat label="REPS" value={`${totalReps(sets)}`} unit="" color={tiles.mint} />}
          </View>
        </>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {SPORTS.map((sp) => {
              const on = sp.key === sportKey;
              return (
                <Pressable key={sp.key} onPress={() => setSportKey(sp.key)} style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 99, backgroundColor: on ? colors.accent : colors.card, borderWidth: 2, borderColor: on ? colors.accent : colors.border }}>
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
          </Card>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Stat label="CALORIES" value={`${cals}`} unit="kcal" color={tiles.pink} />
            {sport.gps && <Stat label="DISTANCE" value={`${dist}`} unit="km" color={tiles.blue} />}
            {detailed && <Stat label="MET" value={`${sport.met}`} unit="" color={tiles.gold} />}
          </View>
          {detailed && (
            <AppText variant="caption" color={colors.textMuted}>
              {Math.round((cals / minutes) * 10) / 10} kcal/min · kcal = MET {sport.met} × {DEFAULT_WEIGHT_KG} kg × {minutes / 60 < 1 ? (minutes / 60).toFixed(2) : minutes / 60} h
            </AppText>
          )}
        </>
      )}

      <Button label={mode === 'gym' ? `Save workout · ${vol.toLocaleString()} kg volume` : `Log ${sport.name} · ${cals} kcal`} onPress={() => router.back()} />
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
