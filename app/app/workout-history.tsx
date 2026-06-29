import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Card, Screen, SectionHeader } from '../src/design-system/components';
import { LineChart } from '../src/components/Charts';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { useWorkouts } from '../src/store/workouts';
import { EXERCISES, SPORTS, MUSCLE_LABEL, percentLoads, trainingPaces, fmtPace, riegelTime, type Muscle } from '../src/data/workouts';
import { computeAcwr, dotsScore, relativeStrength, strengthStandard, STRENGTH_LEVELS, trainingBalance, type StrengthLevel } from '../src/data/health-metrics';
import { useAppState } from '../src/store/app';

const DAY = 86400000;
// × bodyweight only means something on free-weight compounds, not machines or
// bodyweight lifts (where logged weight is added/assisted load, not total).
const freeWeight = (eq?: string) => eq === 'barbell' || eq === 'dumbbell';

export default function WorkoutHistory() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { sessions } = useWorkouts();
  const { body } = useAppState();
  const now = Date.now();
  const [detailed, setDetailed] = useState(false);

  // Seed is demo-only (it powers the Workout screen's example), never count it
  // in real progress stats, or the user sees fabricated "this week" numbers.
  const real = sessions.filter((s) => !s.id.startsWith('seed-'));
  const gym = real.filter((s) => s.kind === 'gym');
  const sport = real.filter((s) => s.kind === 'sport');
  const inWindow = (iso: string, days: number) => {
    const diff = now - Date.parse(iso);
    return diff >= 0 && diff <= days * DAY; // guard against future-dated/skewed timestamps
  };
  const acwr = computeAcwr(real, now);
  const loadColor =
    acwr.status === 'optimal' ? tiles.mint : acwr.status === 'caution' ? tiles.gold : acwr.status === 'high' ? tiles.pink : tiles.blue;

  // this-week headline stats
  const weekTonnage = gym.filter((s) => inWindow(s.at, 7)).reduce((sum, s) => sum + (s.volume ?? 0), 0);
  const weekSessions = real.filter((s) => inWindow(s.at, 7)).length;
  const weekKcal = sport.filter((s) => inWindow(s.at, 7)).reduce((sum, s) => sum + (s.kcal ?? 0), 0);

  // per-exercise progression
  const exKeys = Array.from(new Set(gym.map((s) => s.exKey).filter(Boolean))) as string[];
  const [sel, setSel] = useState('');
  // Guard against async data load: if the selection isn't a real exercise yet, fall back.
  const selKey = exKeys.includes(sel) ? sel : (exKeys[0] ?? '');
  const selSessions = gym.filter((s) => s.exKey === selKey).sort((a, b) => a.at.localeCompare(b.at));
  const e1rmTrend = selSessions.map((s) => s.e1rm ?? 0);
  const best = e1rmTrend.reduce((m, v) => Math.max(m, v), 0);
  const selEx = EXERCISES.find((e) => e.key === selKey);

  // 30-day volume by muscle
  const muscleVol: Partial<Record<Muscle, number>> = {};
  for (const s of gym.filter((g) => inWindow(g.at, 30))) {
    const m = EXERCISES.find((e) => e.key === s.exKey)?.muscle;
    if (m) muscleVol[m] = (muscleVol[m] ?? 0) + (s.volume ?? 0);
  }
  const muscleRows = (Object.entries(muscleVol) as [Muscle, number][]).sort((a, b) => b[1] - a[1]);
  const maxMuscle = muscleRows.reduce((m, [, v]) => Math.max(m, v), 1);
  // Balance is computed from working-SET counts (not tonnage) so heavier leg/back
  // loads don't structurally bias the split, a set is effort-comparable across muscles.
  const muscleSets: Partial<Record<Muscle, number>> = {};
  for (const s of gym.filter((g) => inWindow(g.at, 30))) {
    const m = EXERCISES.find((e) => e.key === s.exKey)?.muscle;
    if (m) muscleSets[m] = (muscleSets[m] ?? 0) + (s.sets?.length ?? 0);
  }
  const balance = trainingBalance(muscleSets);

  // PRs
  const prs = exKeys
    .map((k) => ({ k, best: gym.filter((s) => s.exKey === k).reduce((m, s) => Math.max(m, s.e1rm ?? 0), 0) }))
    .filter((p) => p.best > 0)
    .sort((a, b) => b.best - a.best);

  // DOTS strength score from the big-3 e1RM total, normalized for bodyweight + sex.
  // Only shown once ALL THREE lifts are logged, a partial total would mislead.
  const big3Keys = ['squat', 'bench', 'deadlift'] as const;
  const big3Vals = big3Keys.map((k) => prs.find((p) => p.k === k)?.best ?? 0);
  const big3 = big3Vals.reduce((a, b) => a + b, 0);
  // Bodyweight-ratio metrics (DOTS, strength standards) must not score against the
  // placeholder default weight, a wrong bodyweight shifts the verdict by a full tier.
  const dots = body.weightEntered && big3Vals.every((v) => v > 0) ? dotsScore(big3, body.weightKg, body.sex) : 0;

  // Strength standards, classify the four lifts with established norms against
  // population levels (untrained→elite) by bodyweight ratio. Only logged lifts show.
  const standings = (body.weightEntered ? (['squat', 'bench', 'deadlift', 'ohp'] as const) : [])
    .map((k) => ({ k, best: prs.find((p) => p.k === k)?.best ?? 0 }))
    .filter((x) => x.best > 0)
    .map((x) => ({ k: x.k, best: x.best, s: strengthStandard(x.k, x.best, body.weightKg, body.sex) }))
    .filter((x) => x.s) as { k: string; best: number; s: NonNullable<ReturnType<typeof strengthStandard>> }[];
  // level → tile color (cool → warm as you advance)
  const levelTile: Record<StrengthLevel, { bg: string; ink: string }> = {
    untrained: tiles.blue, beginner: tiles.blue, novice: tiles.lav,
    intermediate: tiles.mint, advanced: tiles.gold, elite: tiles.peach,
  };
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Running training paces, derived from the best recent run (fastest 5 K-equivalent
  // over the last 60 days). One real effort drives the whole zone table.
  const recentRuns = sport.filter((s) => s.sportKey === 'running' && (s.distanceKm ?? 0) >= 1.5 && (s.minutes ?? 0) > 0 && inWindow(s.at, 60));
  const bestRun = recentRuns.reduce<{ d: number; m: number; five: number } | null>((best, s) => {
    const d = s.distanceKm!, m = s.minutes!;
    const five = riegelTime(m, d, 5); // 5 K-equivalent minutes (lower = fitter), one Riegel source
    return !best || five < best.five ? { d, m, five } : best;
  }, null);
  const paces = bestRun ? trainingPaces(bestRun.d, bestRun.m) : null;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: 18 }}>‹</AppText>
        </Pressable>
        <AppText variant="h1" style={{ flex: 1 }}>Progress</AppText>
        <Pressable onPress={() => setDetailed((d) => !d)} style={{ flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: 99, padding: 4 }}>
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

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Stat label="THIS WEEK" value={`${Math.round(weekTonnage / 1000 * 10) / 10}`} unit="t" hint="tonnage lifted" color={tiles.lav} />
        <Stat label="SESSIONS" value={`${weekSessions}`} unit="" hint="this week" color={tiles.peach} />
        <Stat label="SPORT" value={`${weekKcal}`} unit="kcal" hint="this week" color={tiles.pink} />
      </View>

      {/* Training load, acute:chronic workload ratio (injury sweet-spot) */}
      <View style={{ backgroundColor: loadColor.bg, borderRadius: radii.xl, padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="caption" color={loadColor.ink} style={{ letterSpacing: 1.2 }}>TRAINING LOAD · ACUTE:CHRONIC</AppText>
          <AppText variant="h2" color={loadColor.ink}>{acwr.hasRatio ? acwr.ratio : '-'}</AppText>
        </View>
        {/* full risk spectrum on a 0-2 scale: optimal 0.8-1.3 (40-65%), caution 1.3-1.5 (65-75%), high >1.5 (75-100%) */}
        <View style={{ height: 14, borderRadius: 99, backgroundColor: colors.navBg, marginTop: 10, position: 'relative', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: '40%', width: '25%', top: 0, bottom: 0, backgroundColor: colors.accent, opacity: 0.4 }} />
          <View style={{ position: 'absolute', left: '65%', width: '10%', top: 0, bottom: 0, backgroundColor: '#E0A24E', opacity: 0.55 }} />
          <View style={{ position: 'absolute', left: '75%', width: '25%', top: 0, bottom: 0, backgroundColor: colors.danger, opacity: 0.4 }} />
          {acwr.hasRatio && (
            <View style={{ position: 'absolute', left: `${Math.min(98, (acwr.ratio / 2) * 100)}%`, width: 3, top: 0, bottom: 0, backgroundColor: colors.ink }} />
          )}
        </View>
        <AppText variant="title" color={loadColor.ink} style={{ marginTop: 8, textAlign: 'center' }}>{acwr.label}</AppText>
        <AppText variant="caption" color={loadColor.ink} style={{ fontWeight: '600', marginTop: 4, lineHeight: 17 }}>{acwr.note}</AppText>
        {detailed && (
          <AppText variant="caption" color={loadColor.ink} style={{ marginTop: 6, opacity: 0.85 }}>
            acute {acwr.acute} (7d) · chronic {acwr.chronic}/wk (28d avg) · ratio = acute ÷ chronic · sweet spot 0.8-1.3
          </AppText>
        )}
      </View>

      {e1rmTrend.length > 0 ? (
        <>
          <SectionHeader title="Per-exercise progression" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {exKeys.map((k) => {
              const on = k === selKey;
              const e = EXERCISES.find((x) => x.key === k);
              return (
                <Pressable key={k} onPress={() => setSel(k)} style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 99, backgroundColor: on ? colors.accent : colors.card, borderWidth: 2, borderColor: on ? colors.accent : colors.border }}>
                  <AppText variant="caption" color={on ? '#fff' : colors.ink}>{e?.emoji} {e?.name ?? k}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <AppText variant="title">{selEx?.name ?? sel}</AppText>
              <AppText variant="caption" color={colors.accentText}>best {Math.round(best)} kg e1RM{freeWeight(selEx?.equipment) ? ` · ${relativeStrength(best, body.weightKg)}× BW` : ''}</AppText>
            </View>
            <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: 6 }}>
              {selSessions.length} sessions · estimated 1RM by session
            </AppText>
            {e1rmTrend.length > 1 ? (
              <LineChart data={e1rmTrend} color={colors.accentText} height={120} />
            ) : (
              <AppText variant="caption" color={colors.textMuted}>Log another session to see the trend.</AppText>
            )}
            {/* ≥2 sessions, same bar the trend chart uses, never prescribe loads off a one-set estimate */}
            {detailed && e1rmTrend.length > 1 && best > 0 && selEx?.equipment !== 'bodyweight' && (
              <View style={{ marginTop: 12, borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 10 }}>
                <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: 6 }}>TRAINING LOADS · %1RM</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {percentLoads(best).map((r) => (
                    <View key={r.pct} style={{ width: '31%', backgroundColor: colors.navBg, borderRadius: radii.md, paddingVertical: 8, paddingHorizontal: 9 }}>
                      <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>{r.pct}% · ×{r.reps}</AppText>
                      <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>{r.kg} kg</AppText>
                    </View>
                  ))}
                </View>
                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 7, lineHeight: 15 }}>
                  Working weight at each intensity, with the reps it typically allows, from your estimated 1RM.
                </AppText>
              </View>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <AppText variant="caption" color={colors.textMuted}>No gym sessions yet, log one from the Workout screen and your progression shows up here.</AppText>
        </Card>
      )}

      {muscleRows.length > 0 && (
        <>
          <SectionHeader title="30-day volume by muscle" />
          <Card>
            {muscleRows.map(([m, v]) => (
              <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 7 }}>
                <AppText variant="caption" color={colors.textMuted} style={{ width: 78 }}>{MUSCLE_LABEL[m]}</AppText>
                <View style={{ flex: 1, height: 10, borderRadius: 99, backgroundColor: colors.navBg, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.round((v / maxMuscle) * 100)}%`, height: '100%', borderRadius: 99, backgroundColor: colors.accent }} />
                </View>
                <AppText variant="caption" color={colors.ink} style={{ width: 64, textAlign: 'right' }}>{Math.round(v / 1000 * 10) / 10} t</AppText>
              </View>
            ))}
          </Card>

          {(balance.pushPullStatus !== 'unknown' || balance.upperLowerStatus !== 'unknown') && (
            <Card style={{ gap: spacing.md }}>
              <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>TRAINING BALANCE · BY WORKING SETS</AppText>
              {balance.pushPullStatus !== 'unknown' && (
                <BalanceRow
                  label="Push vs Pull"
                  leftLabel="Push" rightLabel="Pull"
                  left={balance.push} right={balance.pull}
                  ok={balance.pushPullStatus === 'balanced'}
                  note={balance.pushPullNote}
                  colors={colors} tiles={tiles}
                />
              )}
              {balance.upperLowerStatus !== 'unknown' && (
                <BalanceRow
                  label="Upper vs Lower"
                  leftLabel="Upper" rightLabel="Lower"
                  left={balance.upper} right={balance.lower}
                  ok={balance.upperLowerStatus === 'balanced'}
                  note={balance.upperLowerNote}
                  colors={colors} tiles={tiles}
                />
              )}
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 10, lineHeight: 14 }}>
                Push/pull counts chest, shoulders & back press/row work (not direct arm sets). A rough directional guide.
              </AppText>
            </Card>
          )}
        </>
      )}

      {dots > 0 && (
        <>
          <SectionHeader title="Strength score" />
          <View style={{ backgroundColor: tiles.peach.bg, borderRadius: radii.xl, padding: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <AppText variant="caption" color={tiles.peach.ink} style={{ letterSpacing: 1.2 }}>DOTS · BIG 3</AppText>
              <AppText variant="h2" color={tiles.peach.ink}>{dots}</AppText>
            </View>
            <AppText variant="caption" color={tiles.peach.ink} style={{ fontWeight: '600', marginTop: 4, lineHeight: 17 }}>
              From your best squat·bench·deadlift estimated 1RM ({Math.round(big3)} kg) at {body.weightKg} kg, a rough DOTS.{detailed ? ` Squat ${Math.round(big3Vals[0])} · bench ${Math.round(big3Vals[1])} · deadlift ${Math.round(big3Vals[2])} kg. Normalized for bodyweight & sex, ~300 solid, 500+ elite.` : ''}
            </AppText>
          </View>
        </>
      )}

      {standings.length > 0 && (
        <>
          <SectionHeader title="Strength standards" />
          <Card>
            {standings.map(({ k, s, best }, i) => {
              const e = EXERCISES.find((x) => x.key === k);
              const tile = levelTile[s.level];
              const idx = STRENGTH_LEVELS.indexOf(s.level);
              return (
                <View key={k} style={{ paddingVertical: 9, borderTopWidth: i === 0 ? 0 : 2, borderTopColor: colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AppText variant="caption" color={colors.ink}>{e?.emoji} {e?.name ?? k}</AppText>
                    <View style={{ backgroundColor: tile.bg, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10 }}>
                      <AppText variant="caption" color={tile.ink} style={{ fontWeight: '700', fontSize: 11 }}>{cap(s.level)}</AppText>
                    </View>
                  </View>
                  {/* five-segment level ladder (untrained→elite), filled to current */}
                  <View style={{ flexDirection: 'row', gap: 3, marginTop: 8 }}>
                    {[0, 1, 2, 3, 4].map((seg) => (
                      <View key={seg} style={{ flex: 1, height: 6, borderRadius: 99, backgroundColor: seg < idx ? tile.ink : colors.navBg }} />
                    ))}
                  </View>
                  {detailed && (
                    <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
                      {s.next ? `+${Math.max(0, s.next.kg - Math.round(best))} kg to ${cap(s.next.level)}` : 'Top tier, elite'}
                    </AppText>
                  )}
                </View>
              );
            })}
            <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 8, lineHeight: 16 }}>
              From your best estimated 1RM vs population norms by bodyweight. Approximate, a guide, not a verdict.
            </AppText>
          </Card>
        </>
      )}

      {prs.length > 0 && (
        <>
          <SectionHeader title="Personal records" />
          <Card>
            {prs.map((p) => {
              const e = EXERCISES.find((x) => x.key === p.k);
              return (
                <View key={p.k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: colors.border }}>
                  <AppText variant="caption" color={colors.ink}>{e?.emoji} {e?.name ?? p.k}</AppText>
                  <AppText variant="caption" color={colors.accentText}>{Math.round(p.best)} kg{freeWeight(e?.equipment) ? ` · ${relativeStrength(p.best, body.weightKg)}× BW` : ''}</AppText>
                </View>
              );
            })}
          </Card>
        </>
      )}

      {paces && bestRun && (
        <>
          <SectionHeader title="Running paces" />
          <Card>
            <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: 8 }}>
              From your fastest recent run ({Math.round(bestRun.d * 10) / 10} km · {Math.round(bestRun.m)} min), training zones per km.
            </AppText>
            {paces.map((p, i) => (
              <View key={p.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 2, borderTopColor: colors.border }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" color={colors.ink} style={{ fontWeight: '700' }}>{p.label}</AppText>
                  {detailed && <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>{p.note}</AppText>}
                </View>
                <AppText variant="caption" color={colors.accentText} style={{ fontWeight: '800' }}>{fmtPace(p.secPerKm)} <AppText variant="caption" color={colors.textMuted}>/km</AppText></AppText>
              </View>
            ))}
            <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 8, lineHeight: 16 }}>
              Assumes that run was a hard effort, log a fast or race-pace run for sharper zones. A guide, not a lab test.
            </AppText>
          </Card>
        </>
      )}

      {sport.length > 0 && (
        <>
          <SectionHeader title="Recent sports" />
          <Card>
            {[...sport].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6).map((ws) => {
              const sp = SPORTS.find((x) => x.key === ws.sportKey);
              return (
                <View key={ws.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: colors.border }}>
                  <AppText variant="caption" color={colors.ink}>{sp?.emoji} {sp?.name ?? ws.sportKey} · {ws.minutes ?? 0} min</AppText>
                  <AppText variant="caption" color={colors.textMuted}>{ws.kcal ?? 0} kcal{ws.distanceKm ? ` · ${ws.distanceKm} km` : ''} · {ws.at.slice(5, 10)}</AppText>
                </View>
              );
            })}
          </Card>
        </>
      )}
    </Screen>
  );
}

function BalanceRow({ label, leftLabel, rightLabel, left, right, ok, note, colors, tiles }: {
  label: string; leftLabel: string; rightLabel: string; left: number; right: number; ok: boolean; note: string;
  colors: ReturnType<typeof useTheme>['colors']; tiles: ReturnType<typeof useTheme>['tiles'];
}) {
  const total = left + right;
  const leftPct = total > 0 ? Math.round((left / total) * 100) : 50;
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <AppText variant="caption" color={colors.ink} style={{ fontWeight: '700' }}>{label}</AppText>
        <View style={{ backgroundColor: ok ? tiles.mint.bg : tiles.gold.bg, borderRadius: 99, paddingVertical: 2, paddingHorizontal: 9 }}>
          <AppText variant="caption" color={ok ? tiles.mint.ink : tiles.gold.ink} style={{ fontSize: 10, fontWeight: '800' }}>{ok ? 'Balanced' : 'Check'}</AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', height: 10, borderRadius: 99, overflow: 'hidden' }}>
        <View style={{ flex: Math.max(0.001, left), backgroundColor: colors.accent }} />
        <View style={{ flex: Math.max(0.001, right), backgroundColor: tiles.lav.ink }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>{leftLabel} {leftPct}%</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>{rightLabel} {100 - leftPct}%</AppText>
      </View>
      <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 5, lineHeight: 15 }}>{note}</AppText>
    </View>
  );
}

function Stat({ label, value, unit, hint, color }: { label: string; value: string; unit: string; hint: string; color: { bg: string; ink: string } }) {
  return (
    <View style={{ flex: 1, backgroundColor: color.bg, borderRadius: radii.xl, padding: spacing.md }}>
      <AppText variant="caption" color={color.ink} style={{ letterSpacing: 1, fontSize: 9 }}>{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 4 }}>
        <AppText variant="h2" style={{ fontSize: 20 }}>{value}</AppText>
        {!!unit && <AppText variant="caption" color={color.ink} style={{ marginBottom: 3, fontSize: 10 }}>{unit}</AppText>}
      </View>
      <AppText variant="caption" color={color.ink} style={{ fontSize: 9, marginTop: 2, opacity: 0.8 }}>{hint}</AppText>
    </View>
  );
}
