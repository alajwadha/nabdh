import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Card, Screen, SectionHeader } from '../src/design-system/components';
import { Icon } from '../src/components/Icon';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { useAppState } from '../src/store/app';
import { useHealth } from '../src/store/health';
import { DEMO_SUMMARY } from '../src/integrations/demo';
import { ACTIVITY_LEVELS, bmi, bmr, hrZones, maxHr, tdee, vo2Band, vo2maxEstimate, whtr, goalProjection, navyBodyFat, bodyFatBand } from '../src/data/health-metrics';
import { displayWeight, displayHeight, displayLength, weightStepKg, heightStepCm, kgToLb } from '../src/services/units';

const ZONE_COLORS = ['blue', 'mint', 'gold', 'peach', 'pink'] as const;

export default function Body() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { body, setBody, budget, units } = useAppState();
  const { summary } = useHealth();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);
  const [detailed, setDetailed] = useState(false);
  const hasVitals = !!(s && (s.restingHeartRate != null || s.hrvSdnn != null || s.spo2 != null));

  const b = bmi(body.weightKg, body.heightCm);
  const mhr = maxHr(body.age);
  const zones = hrZones(body.age);
  const vo2 = s?.restingHeartRate != null ? vo2maxEstimate(mhr, s.restingHeartRate) : null;
  const energyBmr = bmr(body.weightKg, body.heightCm, body.age, body.sex);
  const activity = ACTIVITY_LEVELS.find((a) => a.key === body.activity) ?? ACTIVITY_LEVELS[2];
  const energyTdee = tdee(energyBmr, activity.factor);
  // The Daily target IS the store's Food budget, one number, never two that drift.
  const deficitCapped = body.goal === 'cut' && energyTdee - 500 < budget;
  const bmiBandColor = b.band === 'Healthy' ? tiles.mint : b.band === 'Underweight' ? tiles.blue : b.band === 'Overweight' ? tiles.gold : tiles.pink;
  // Waist-to-height ratio, only when the user has actually measured their waist.
  const w = (body.waistCm ?? 0) > 0 ? whtr(body.waistCm!, body.heightCm) : null;
  const wColor = w == null ? tiles.blue : w.band === 'Healthy' ? tiles.mint : w.band === 'Increased risk' ? tiles.gold : tiles.pink;
  // WHtR gauge on a 0.35-0.70 scale: healthy <0.5 (0-43%), increased 0.5-0.6 (43-71%), high ≥0.6 (71-100%)
  const wPos = w == null ? 0 : Math.max(0, Math.min(98, ((w.value - 0.35) / 0.35) * 100));
  // US Navy body-fat %, needs neck + waist (+ hip for women).
  const bf = navyBodyFat(body.sex, body.heightCm, body.neckCm ?? 0, body.waistCm ?? 0, body.hipCm ?? 0);
  const bfBand = bf != null ? bodyFatBand(bf, body.sex) : null;
  // Whole kg, the ±3-4% BF estimate carries ±2-3 kg, so 0.1-kg precision would overstate it.
  const leanKg = bf != null ? Math.round(body.weightKg * (1 - bf / 100)) : null;
  const bfColor = bf == null ? tiles.blue : bfBand === 'Fitness' || bfBand === 'Athletic' ? tiles.mint : bfBand === 'Average' ? tiles.gold : bfBand === 'Essential' ? tiles.blue : tiles.pink;
  // Goal timeline, projected weeks to the target weight at the plan's energy delta.
  const energyDelta = budget - energyTdee; // <0 deficit, >0 surplus
  const target = body.targetWeightKg ?? 0;
  const proj = body.goal !== 'maintain' && target > 0 ? goalProjection(body.weightKg, target, energyDelta) : null;
  // Past ~16 weeks the constant-rate model drifts optimistic (TDEE falls as you lighten),
  // so we coarsen both the week count and the date rather than imply false precision.
  const longHorizon = !!proj && proj.reachable && !proj.atTarget && proj.weeks > 16;
  const weeksText = proj ? (longHorizon ? '16+' : `${proj.weeks}`) : '';
  const etaLabel = proj && proj.reachable && !proj.atTarget
    ? (() => {
        const d = new Date(Date.now() + proj.weeks * 7 * 86400000);
        const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (longHorizon) return `around ${monthYear}`;
        const day = d.getDate();
        return `by ${day <= 10 ? 'early' : day <= 20 ? 'mid' : 'late'} ${monthYear}`;
      })()
    : null;
  // BMI gauge on a 15-40 scale (severe obesity is common in-market, don't cap at 35)
  const bmiPos = Math.max(0, Math.min(100, ((b.value - 15) / 25) * 100));

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: 18 }}>‹</AppText>
        </Pressable>
        <AppText variant="h1" style={{ flex: 1 }}>Body</AppText>
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

      {/* resting vitals, never fabricate; show a connect prompt without real data */}
      {hasVitals ? (
        <View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Vital label="REST HR" value={s?.restingHeartRate} unit="bpm" color={tiles.peach} />
            <Vital label="HRV" value={s?.hrvSdnn} unit="ms" color={tiles.lav} />
            <Vital label="BLOOD O₂" value={s?.spo2} unit="%" color={tiles.blue} />
          </View>
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6, marginLeft: 2 }}>From your last overnight sync.</AppText>
          {vo2 != null && (
            <View style={{ backgroundColor: tiles.mint.bg, borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <AppText variant="caption" color={tiles.mint.ink} style={{ letterSpacing: 1.2 }}>EST. VO₂ MAX · CARDIO FITNESS</AppText>
                <AppText variant="h2" color={tiles.mint.ink}>{vo2} <AppText variant="caption" color={tiles.mint.ink}>ml/kg/min</AppText></AppText>
              </View>
              <AppText variant="caption" color={tiles.mint.ink} style={{ fontWeight: '600', marginTop: 4 }}>
                {vo2Band(vo2, body.age, body.sex)} for your age &amp; sex.{detailed ? ` 15.3 × age-estimated max HR ${mhr} ÷ resting ${s?.restingHeartRate} (Uth 2004), a ballpark.` : ''}
              </AppText>
            </View>
          )}
        </View>
      ) : (
        <Card>
          <AppText variant="caption" color={colors.textMuted} style={{ lineHeight: 18 }}>
            Connect Apple Health or a device to see your resting heart rate, HRV, and blood oxygen.
          </AppText>
        </Card>
      )}

      {/* BMI */}
      <View style={{ backgroundColor: bmiBandColor.bg, borderRadius: radii.xl, padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="caption" color={bmiBandColor.ink} style={{ letterSpacing: 1.2 }}>BODY MASS INDEX</AppText>
          <AppText variant="h2" color={bmiBandColor.ink}>{b.value} · {b.band}</AppText>
        </View>
        <View style={{ height: 14, borderRadius: 99, backgroundColor: colors.navBg, marginTop: 10, position: 'relative', overflow: 'hidden' }}>
          {/* 15-40 scale: healthy 18.5-25 (14-40%), overweight 25-30 (40-60%), obese 30-40 (60-100%) */}
          <View style={{ position: 'absolute', left: '14%', width: '26%', top: 0, bottom: 0, backgroundColor: colors.accent, opacity: 0.4 }} />
          <View style={{ position: 'absolute', left: '40%', width: '20%', top: 0, bottom: 0, backgroundColor: '#E0A24E', opacity: 0.45 }} />
          <View style={{ position: 'absolute', left: '60%', width: '40%', top: 0, bottom: 0, backgroundColor: colors.danger, opacity: 0.4 }} />
          <View style={{ position: 'absolute', left: `${Math.min(98, bmiPos)}%`, width: 3, top: 0, bottom: 0, backgroundColor: colors.ink }} />
        </View>
        <AppText variant="caption" color={bmiBandColor.ink} style={{ marginTop: 6, opacity: 0.8 }}>
          BMI doesn’t account for muscle, a lean lifter can read high.
        </AppText>
        {detailed && (
          <AppText variant="caption" color={bmiBandColor.ink} style={{ marginTop: 4, opacity: 0.85 }}>
            BMI = weight ÷ height² = {body.weightKg} ÷ ({(body.heightCm / 100).toFixed(2)})² · healthy 18.5-25
          </AppText>
        )}
      </View>

      {/* Waist-to-height ratio, captures the fat distribution BMI misses */}
      {w ? (
        <View style={{ backgroundColor: wColor.bg, borderRadius: radii.xl, padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <AppText variant="caption" color={wColor.ink} style={{ letterSpacing: 1.2 }}>WAIST-TO-HEIGHT</AppText>
            <AppText variant="h2" color={wColor.ink}>{w.value.toFixed(2)} · {w.band}</AppText>
          </View>
          <View style={{ height: 14, borderRadius: 99, backgroundColor: colors.navBg, marginTop: 10, position: 'relative', overflow: 'hidden' }}>
            <View style={{ position: 'absolute', left: '0%', width: '43%', top: 0, bottom: 0, backgroundColor: colors.accent, opacity: 0.4 }} />
            <View style={{ position: 'absolute', left: '43%', width: '28%', top: 0, bottom: 0, backgroundColor: '#E0A24E', opacity: 0.45 }} />
            <View style={{ position: 'absolute', left: '71%', width: '29%', top: 0, bottom: 0, backgroundColor: colors.danger, opacity: 0.4 }} />
            <View style={{ position: 'absolute', left: `${wPos}%`, width: 3, top: 0, bottom: 0, backgroundColor: colors.ink }} />
          </View>
          <AppText variant="caption" color={wColor.ink} style={{ marginTop: 6, opacity: 0.85 }}>{w.note}</AppText>
          {detailed && (
            <AppText variant="caption" color={wColor.ink} style={{ marginTop: 4, opacity: 0.85 }}>
              WHtR = waist ÷ height = {body.waistCm} ÷ {body.heightCm} cm · healthy &lt;0.5, high ≥0.6 · captures central fat BMI can’t.
            </AppText>
          )}
        </View>
      ) : detailed ? (
        <View style={{ backgroundColor: tiles.blue.bg, borderRadius: radii.xl, padding: spacing.lg }}>
          <AppText variant="caption" color={tiles.blue.ink} style={{ letterSpacing: 1.2 }}>WAIST-TO-HEIGHT</AppText>
          <AppText variant="caption" color={tiles.blue.ink} style={{ marginTop: 6, opacity: 0.85 }}>
            Add your waist measurement under “Your body” below to see your waist-to-height ratio, a better risk marker than BMI for most adults.
          </AppText>
        </View>
      ) : null}

      {/* US Navy body-fat %, separates fat from lean mass */}
      {bf != null ? (
        <View style={{ backgroundColor: bfColor.bg, borderRadius: radii.xl, padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <AppText variant="caption" color={bfColor.ink} style={{ letterSpacing: 1.2 }}>BODY FAT · NAVY METHOD</AppText>
            <AppText variant="h2" color={bfColor.ink}>{bf}% · {bfBand}</AppText>
          </View>
          <AppText variant="caption" color={bfColor.ink} style={{ marginTop: 6, opacity: 0.9, lineHeight: 17 }}>
            ≈ {displayWeight(leanKg ?? 0, units).value} {displayWeight(leanKg ?? 0, units).unit} lean, {displayWeight(body.weightKg - (leanKg ?? 0), units).value} {displayWeight(body.weightKg - (leanKg ?? 0), units).unit} fat. A tape estimate (±3-4%) that can read high for muscular builds, track the trend, not the decimal.
          </AppText>
          {detailed && (
            <AppText variant="caption" color={bfColor.ink} style={{ marginTop: 4, opacity: 0.8, lineHeight: 16 }}>
              From neck {body.neckCm}{body.sex === 'female' ? `, waist ${body.waistCm}, hip ${body.hipCm}` : `, waist ${body.waistCm}`} & height {body.heightCm} cm (US Navy circumference method · ACE bands).
            </AppText>
          )}
        </View>
      ) : detailed ? (
        <View style={{ backgroundColor: tiles.blue.bg, borderRadius: radii.xl, padding: spacing.lg }}>
          <AppText variant="caption" color={tiles.blue.ink} style={{ letterSpacing: 1.2 }}>BODY FAT · NAVY METHOD</AppText>
          <AppText variant="caption" color={tiles.blue.ink} style={{ marginTop: 6, opacity: 0.85 }}>
            Add your neck{body.sex === 'female' ? ', waist & hip' : ' & waist'} measurements under “Your body” to estimate body-fat % and lean mass, what BMI can’t tell you apart.
          </AppText>
        </View>
      ) : null}

      {/* energy needs, BMR / TDEE */}
      <SectionHeader title="Energy needs" />
      <View style={{ backgroundColor: tiles.gold.bg, borderRadius: radii.xl, padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="caption" color={tiles.gold.ink} style={{ letterSpacing: 1.2 }}>MAINTENANCE · {activity.label.toUpperCase()}</AppText>
          <AppText variant="h2" color={tiles.gold.ink}>{energyTdee.toLocaleString()} <AppText variant="caption" color={tiles.gold.ink}>kcal</AppText></AppText>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {ACTIVITY_LEVELS.map((a) => {
            const on = a.key === body.activity;
            return (
              <Pressable key={a.key} onPress={() => setBody({ activity: a.key })} style={{ paddingVertical: 7, paddingHorizontal: 11, borderRadius: 99, backgroundColor: on ? colors.accent : colors.card, borderWidth: 2, borderColor: on ? colors.accent : colors.border }}>
                <AppText variant="caption" color={on ? '#fff' : colors.ink} style={{ fontSize: 11 }}>{a.label}</AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {([['maintain', 'Maintain'], ['cut', 'Lose'], ['gain', 'Gain']] as const).map(([g, lbl]) => {
            const on = body.goal === g;
            return (
              <Pressable key={g} onPress={() => setBody({ goal: g })} style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 99, backgroundColor: on ? colors.navOn : colors.card, borderWidth: 2, borderColor: on ? colors.navOn : colors.border }}>
                <AppText variant="caption" color={on ? colors.navOnText : colors.ink} style={{ fontSize: 11 }}>{lbl}</AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
          <AppText variant="title" color={tiles.gold.ink}>Daily target</AppText>
          <AppText variant="h2" color={tiles.gold.ink}>{budget.toLocaleString()} <AppText variant="caption" color={tiles.gold.ink}>kcal</AppText></AppText>
        </View>
        <AppText variant="caption" color={tiles.gold.ink} style={{ marginTop: 4, opacity: 0.8 }}>
          An estimate (±10%), trust your 2-3 week weight trend. This drives your Food budget.
          {deficitCapped ? ' Your deficit is capped at a safe minimum.' : ''}
        </AppText>
        {detailed && (
          <AppText variant="caption" color={tiles.gold.ink} style={{ marginTop: 4, opacity: 0.85 }}>
            BMR {energyBmr.toLocaleString()} (Mifflin-St Jeor) × {activity.factor} = {energyTdee.toLocaleString()}{body.goal === 'cut' ? ' - 500' : body.goal === 'gain' ? ' + 300' : ''} → {budget.toLocaleString()} kcal, floored at a safe minimum
          </AppText>
        )}
      </View>

      {/* goal timeline, projected ETA to the target weight */}
      {body.goal !== 'maintain' && (
        <>
          <SectionHeader title="Goal timeline" />
          <View style={{ backgroundColor: tiles.lav.bg, borderRadius: radii.xl, padding: spacing.lg }}>
            <Stepper
              label="Target weight"
              value={target}
              displayValue={displayWeight(target, units).value}
              unit={displayWeight(target, units).unit}
              placeholder="Set"
              onMinus={() => setBody({ targetWeightKg: target > 0 ? Math.max(35, target - weightStepKg(units)) : 0 })}
              onPlus={() => setBody({ targetWeightKg: target > 0 ? target + weightStepKg(units) : (body.goal === 'cut' ? Math.max(35, Math.round(body.weightKg) - 5) : Math.round(body.weightKg) + 5) })}
              colors={colors}
              last
            />
            {proj == null ? (
              <AppText variant="caption" color={tiles.lav.ink} style={{ marginTop: 8, opacity: 0.85, lineHeight: 17 }}>
                Set a target weight to see roughly when you’ll reach it at your current plan.
              </AppText>
            ) : proj.atTarget ? (
              <AppText variant="caption" color={tiles.lav.ink} style={{ marginTop: 8, opacity: 0.9, lineHeight: 17 }}>
                You’re at your target, switch your goal to Maintain to hold it.
              </AppText>
            ) : !proj.reachable ? (
              <AppText variant="caption" color={tiles.lav.ink} style={{ marginTop: 8, opacity: 0.9, lineHeight: 17 }}>
                Your target is {proj.kgToGo > 0 ? 'above' : 'below'} your current weight, but your plan runs a {energyDelta < 0 ? 'deficit' : 'surplus'}. Switch your goal to {proj.kgToGo > 0 ? 'Gain' : 'Lose'} (or adjust the target) to line them up.
              </AppText>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
                  <AppText variant="h2" color={tiles.lav.ink}>≈ {weeksText} weeks</AppText>
                  <AppText variant="caption" color={tiles.lav.ink} style={{ fontWeight: '700' }}>{displayWeight(Math.abs(proj.kgToGo), units).value} {displayWeight(Math.abs(proj.kgToGo), units).unit} to go</AppText>
                </View>
                <AppText variant="caption" color={tiles.lav.ink} style={{ marginTop: 6, fontWeight: '600', lineHeight: 17 }}>
                  ~{displayWeight(target, units).value} {displayWeight(target, units).unit} {etaLabel}, at ~{units === 'imperial' ? `${kgToLb(Math.abs(proj.weeklyRateKg)).toFixed(1)} lb` : `${Math.abs(proj.weeklyRateKg)} kg`}/week.
                </AppText>
                <AppText variant="caption" color={tiles.lav.ink} style={{ marginTop: 4, opacity: 0.8, lineHeight: 16 }}>
                  At this rate, real change isn’t linear{longHorizon ? ', and it slows as you lighten' : ''}, so trust your 2-3 week trend over the date.{detailed ? ` Based on a ${Math.abs(energyDelta)} kcal/day ${energyDelta < 0 ? 'deficit' : 'surplus'} (~7,700 kcal ≈ 1 kg).` : ''}
                </AppText>
              </>
            )}
          </View>
        </>
      )}

      {/* heart-rate training zones */}
      <SectionHeader title={`Heart-rate zones · max ${mhr} bpm`} />
      <Card>
        {zones.map((z, i) => {
          const c = tiles[ZONE_COLORS[i]];
          return (
            <View key={z.z} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 8, borderBottomWidth: i === zones.length - 1 ? 0 : 2, borderBottomColor: colors.border }}>
              <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="caption" color={c.ink} style={{ fontSize: 11 }}>Z{z.z}</AppText>
              </View>
              <AppText variant="title" style={{ flex: 1, fontSize: 14 }}>{z.name}</AppText>
              <AppText variant="caption" color={colors.textMuted}>{z.lo}-{z.hi} bpm</AppText>
            </View>
          );
        })}
        {detailed && (
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
            Max HR via Tanaka (208 - 0.7 × age). Zones are % of max, train Z2 for base, Z4-5 sparingly.
          </AppText>
        )}
      </Card>

      {/* body profile (editable in detailed) */}
      {detailed && (
        <>
          <SectionHeader title="Your body" />
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: colors.border }}>
              <AppText variant="title" style={{ fontSize: 14 }}>Sex</AppText>
              <View style={{ flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: 99, padding: 4 }}>
                {(['male', 'female'] as const).map((sx) => {
                  const on = body.sex === sx;
                  return (
                    <Pressable key={sx} onPress={() => setBody({ sex: sx })} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 99, backgroundColor: on ? colors.navOn : 'transparent' }}>
                      <AppText variant="caption" color={on ? colors.navOnText : colors.textMuted}>{sx === 'male' ? 'Male' : 'Female'}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Stepper label="Age" value={body.age} unit="yrs" onMinus={() => setBody({ age: Math.max(12, body.age - 1) })} onPlus={() => setBody({ age: body.age + 1 })} colors={colors} />
            <Stepper label="Height" value={body.heightCm} displayValue={displayHeight(body.heightCm, units).value} unit={displayHeight(body.heightCm, units).unit} onMinus={() => setBody({ heightCm: Math.max(120, body.heightCm - heightStepCm(units)) })} onPlus={() => setBody({ heightCm: body.heightCm + heightStepCm(units) })} colors={colors} />
            <Stepper label="Weight" value={body.weightKg} displayValue={displayWeight(body.weightKg, units).value} unit={displayWeight(body.weightKg, units).unit} onMinus={() => setBody({ weightKg: Math.max(35, body.weightKg - weightStepKg(units)) })} onPlus={() => setBody({ weightKg: body.weightKg + weightStepKg(units) })} colors={colors} />
            {/* waist drives the waist-to-height ratio; starts unset (placeholder) so we never assume a measurement */}
            <Stepper label="Waist" value={body.waistCm ?? 0} displayValue={displayLength(body.waistCm ?? 0, units).value} unit={displayLength(body.waistCm ?? 0, units).unit} placeholder="Add" onMinus={() => setBody({ waistCm: (body.waistCm ?? 0) > 0 ? Math.max(50, body.waistCm! - heightStepCm(units)) : 0 })} onPlus={() => setBody({ waistCm: (body.waistCm ?? 0) > 0 ? body.waistCm! + heightStepCm(units) : Math.round(body.heightCm * 0.5) })} colors={colors} />
            {/* neck (+ hip for women) drive the Navy body-fat estimate */}
            <Stepper label="Neck" value={body.neckCm ?? 0} displayValue={displayLength(body.neckCm ?? 0, units).value} unit={displayLength(body.neckCm ?? 0, units).unit} placeholder="Add" onMinus={() => setBody({ neckCm: (body.neckCm ?? 0) > 0 ? Math.max(25, body.neckCm! - heightStepCm(units)) : 0 })} onPlus={() => setBody({ neckCm: (body.neckCm ?? 0) > 0 ? body.neckCm! + heightStepCm(units) : (body.sex === 'female' ? 32 : 38) })} colors={colors} last={body.sex !== 'female'} />
            {body.sex === 'female' && (
              <Stepper label="Hip" value={body.hipCm ?? 0} displayValue={displayLength(body.hipCm ?? 0, units).value} unit={displayLength(body.hipCm ?? 0, units).unit} placeholder="Add" onMinus={() => setBody({ hipCm: (body.hipCm ?? 0) > 0 ? Math.max(60, body.hipCm! - heightStepCm(units)) : 0 })} onPlus={() => setBody({ hipCm: (body.hipCm ?? 0) > 0 ? body.hipCm! + heightStepCm(units) : Math.round(body.heightCm * 0.55) })} colors={colors} last />
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

function Vital({ label, value, unit, color }: { label: string; value?: number; unit: string; color: { bg: string; ink: string } }) {
  return (
    <View style={{ flex: 1, backgroundColor: color.bg, borderRadius: radii.xl, padding: spacing.md }}>
      <AppText variant="caption" color={color.ink} style={{ fontSize: 9, letterSpacing: 1 }}>{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 4 }}>
        <AppText variant="h2" style={{ fontSize: 20 }}>{value != null ? value : '-'}</AppText>
        {value != null && <AppText variant="caption" color={color.ink} style={{ marginBottom: 3, fontSize: 10 }}>{unit}</AppText>}
      </View>
    </View>
  );
}

function Stepper({ label, value, unit, onMinus, onPlus, colors, last, placeholder, displayValue }: { label: string; value: number; unit: string; onMinus: () => void; onPlus: () => void; colors: ReturnType<typeof useTheme>['colors']; last?: boolean; placeholder?: string; displayValue?: string }) {
  const showPlaceholder = placeholder != null && value <= 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: last ? 0 : 2, borderBottomColor: colors.border }}>
      <AppText variant="title" style={{ fontSize: 14 }}>{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={onMinus} accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} hitSlop={8} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={15} color={colors.textSecondary} /></Pressable>
        <View style={{ minWidth: 64, alignItems: 'center' }}>
          {showPlaceholder
            ? <AppText variant="caption" color={colors.textMuted}>{placeholder}</AppText>
            : <AppText variant="title">{displayValue ?? value}{unit ? ' ' : ''}<AppText variant="caption" color={colors.textMuted}>{unit}</AppText></AppText>}
        </View>
        <Pressable onPress={onPlus} accessibilityRole="button" accessibilityLabel={`Increase ${label}`} hitSlop={8} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={15} color={colors.textSecondary} /></Pressable>
      </View>
    </View>
  );
}
