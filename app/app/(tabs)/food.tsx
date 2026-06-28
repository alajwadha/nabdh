import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, Screen } from '../../src/design-system/components';
import { AppHeader } from '../../src/components/AppHeader';
import { Icon } from '../../src/components/Icon';
import { CoachCard } from '../../src/components/Dashboard';
import { radii, spacing } from '../../src/design-system';
import { useTheme } from '../../src/design-system/theme';
import { useAppState } from '../../src/store/app';
import { useHealth } from '../../src/store/health';
import { DEMO_IDENTITY, DEMO_SUMMARY } from '../../src/integrations/demo';
import { weekdayName } from '../../src/data/derive';
import { proteinPerKgTarget, fiberTarget, macroEnergySplit } from '../../src/data/health-metrics';

const MACRO_COLORS = { protein: '#2E7D5B', carbs: '#E0A24E', fat: '#8E81D6' };

export default function Food() {
  const { colors, tiles } = useTheme();
  const { water, waterGoal, addWater, meals, kcal, macros, macroGoals, budget, body } = useAppState();
  const { summary } = useHealth();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);
  const [detailed, setDetailed] = useState(false);
  const left = Math.max(0, budget - kcal);
  const shownWater = Math.min(water, waterGoal); // a lowered goal can't show a maxed-out bar

  // Measured energy out today = basal + active (active is incremental over basal,
  // so no double-counting). Only when both device fields exist. We deliberately do
  // NOT compute a net "deficit" here: intake accrues all day while burn is whole-day,
  // so any midday net is structurally a large deficit — misleading. We show the
  // measured figures and let the deficit settle by bedtime.
  const burn = s && s.basalEnergyKcal != null && s.activeEnergyKcal != null ? s.basalEnergyKcal + s.activeEnergyKcal : null;

  // Nutrition detail — all from real consumed macros + the body profile.
  const proteinPerKg = body.weightKg > 0 ? Math.round((macros.protein / body.weightKg) * 10) / 10 : 0;
  const proteinTarget = proteinPerKgTarget(body.goal);
  const fiberGoal = fiberTarget(budget);
  const split = macroEnergySplit(macros.protein, macros.carbs, macros.fat);

  const macroRows: [string, number, keyof typeof MACRO_COLORS][] = [
    ['PROTEIN', macros.protein, 'protein'],
    ['CARBS', macros.carbs, 'carbs'],
    ['FAT', macros.fat, 'fat'],
  ];

  return (
    <Screen>
      <AppHeader />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
        <AppText variant="h1" style={{ flex: 1 }}>Food diary</AppText>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <AppText variant="caption" color={colors.textMuted}>{weekdayName()} · budget {budget.toLocaleString()} kcal ·</AppText>
        <Icon name="flame" size={12} color={colors.textMuted} />
        <AppText variant="caption" color={colors.textMuted}>{DEMO_IDENTITY.foodStreakDays}-day streak</AppText>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="h2">
            {kcal.toLocaleString()} <AppText variant="caption" color={colors.textMuted}>/ {budget.toLocaleString()} kcal</AppText>
          </AppText>
          <AppText variant="caption" color={colors.accentText}>
            {left} left
          </AppText>
        </View>
        <View style={{ height: 13, borderRadius: 99, backgroundColor: colors.navBg, overflow: 'hidden', marginTop: 4 }}>
          <View style={{ width: `${Math.min(100, (kcal / budget) * 100)}%`, height: '100%', borderRadius: 99, backgroundColor: colors.accent }} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          {macroRows.map(([label, grams, key]) => (
            <View key={label} style={{ flex: 1 }}>
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 9, letterSpacing: 1, textAlign: 'center' }}>
                {label}
              </AppText>
              <AppText variant="title" style={{ textAlign: 'center', marginTop: 2 }}>
                {grams}<AppText variant="caption" color={colors.textMuted}>/{macroGoals[key]}g</AppText>
              </AppText>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.navBg, marginTop: 5, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, (grams / (macroGoals[key] || 1)) * 100)}%`, height: '100%', backgroundColor: MACRO_COLORS[key], borderRadius: 99 }} />
              </View>
            </View>
          ))}
        </View>
      </Card>

      {detailed && burn != null && (
        <Card>
          <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: 8 }}>TODAY’S ENERGY · MEASURED</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1, alignItems: 'center', backgroundColor: tiles.gold.bg, borderRadius: radii.lg, paddingVertical: 12 }}>
              <AppText variant="caption" color={tiles.gold.ink} style={{ fontSize: 9, letterSpacing: 1 }}>EATEN SO FAR</AppText>
              <AppText variant="h2" color={tiles.gold.ink} style={{ fontSize: 19 }}>{kcal.toLocaleString()}</AppText>
            </View>
            <View style={{ flex: 1, alignItems: 'center', backgroundColor: tiles.blue.bg, borderRadius: radii.lg, paddingVertical: 12 }}>
              <AppText variant="caption" color={tiles.blue.ink} style={{ fontSize: 9, letterSpacing: 1 }}>BURNED</AppText>
              <AppText variant="h2" color={tiles.blue.ink} style={{ fontSize: 19 }}>{burn.toLocaleString()}</AppText>
            </View>
          </View>
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 8, lineHeight: 16 }}>
            Burned = basal {s!.basalEnergyKcal!.toLocaleString()} + active {s!.activeEnergyKcal!.toLocaleString()}, measured by your device today. The gap becomes your deficit or surplus once the day’s done — your plan targets {budget.toLocaleString()} kcal in.
          </AppText>
        </Card>
      )}

      {detailed && (
        <Card>
          <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: 4 }}>NUTRITION DETAIL</AppText>

          {/* protein per kg — the lens lifters actually track */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
            <AppText variant="caption" color={colors.ink} style={{ fontWeight: '700' }}>Protein density</AppText>
            <AppText variant="caption" color={colors.accentText} style={{ fontWeight: '800' }}>
              {proteinPerKg} <AppText variant="caption" color={colors.textMuted}>/ {proteinTarget} g/kg</AppText>
            </AppText>
          </View>
          <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.navBg, marginTop: 5, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, (proteinPerKg / proteinTarget) * 100)}%`, height: '100%', backgroundColor: MACRO_COLORS.protein, borderRadius: 99 }} />
          </View>
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 5, lineHeight: 15 }}>
            {proteinPerKg >= proteinTarget
              ? `At your ${proteinTarget} g/kg target for ${body.goal === 'cut' ? 'a cut' : body.goal === 'gain' ? 'a lean gain' : 'maintenance'} — muscle protected.`
              : `${proteinPerKg} g/kg so far — on track for ${proteinTarget} as the day fills in.`}
          </AppText>

          {/* energy split from real macros */}
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 12, height: 10, borderRadius: 99, overflow: 'hidden' }}>
            {split.protein + split.carbs + split.fat > 0 ? (
              <>
                <View style={{ flex: split.protein, backgroundColor: MACRO_COLORS.protein }} />
                <View style={{ flex: split.carbs, backgroundColor: MACRO_COLORS.carbs }} />
                <View style={{ flex: split.fat, backgroundColor: MACRO_COLORS.fat }} />
              </>
            ) : (
              <View style={{ flex: 1, backgroundColor: colors.navBg }} />
            )}
          </View>
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 5 }}>
            Energy split · {split.protein}% protein · {split.carbs}% carbs · {split.fat}% fat
          </AppText>

          {/* fibre target (recommendation, not consumed — meal fibre isn't tracked yet) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 2, borderTopColor: colors.border }}>
            <AppText variant="caption" color={colors.ink} style={{ fontWeight: '700' }}>Fibre target</AppText>
            <AppText variant="caption" color={colors.textMuted}>~{fiberGoal} g/day</AppText>
          </View>
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 4, lineHeight: 15 }}>
            14 g per 1,000 kcal (IOM), scaled to your budget. Dates, legumes & whole grains get you there.
          </AppText>
        </Card>
      )}

      <Card>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4 }}>
          WATER · {shownWater} / {waterGoal} GLASSES · ~{((waterGoal * 250) / 1000).toFixed(1)} L
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
            {Array.from({ length: waterGoal }).map((_, i) => (
              <View
                key={i}
                style={{ width: 20, height: 27, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 9, borderBottomRightRadius: 9, borderWidth: 2, backgroundColor: i < shownWater ? '#9CCFE8' : colors.navBg, borderColor: i < shownWater ? '#6FB4D8' : colors.border }}
              />
            ))}
          </View>
          <Pressable onPress={addWater} style={{ backgroundColor: colors.navOn, borderRadius: 99, paddingVertical: 11, paddingHorizontal: 16 }}>
            <AppText variant="caption" color={colors.navOnText}>
              ＋ Glass
            </AppText>
          </Pressable>
        </View>
      </Card>

      {meals.map((m) => (
        <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.lg, padding: 12 }}>
          <View style={{ width: 50, height: 50, borderRadius: 17, backgroundColor: tiles[m.color].bg }} />
          <View style={{ flex: 1 }}>
            <AppText variant="title">{m.name}</AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '500' }}>
              {m.meta}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="h2" style={{ fontSize: 15 }}>
              {m.kcal}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 9.5 }}>
              kcal
            </AppText>
          </View>
        </View>
      ))}

      <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radii.lg, padding: 14, alignItems: 'center' }}>
        <AppText variant="caption" color={colors.textMuted}>
          Dinner — keep it under {left} kcal to stay on plan
        </AppText>
      </View>

      <CoachCard>
        {macros.protein >= macroGoals.protein
          ? `Protein’s done (${macros.protein}/${macroGoals.protein}g). Something light tonight — shorbat adas fits.`
          : `${macroGoals.protein - macros.protein}g protein to go. Grilled chicken or laban closes the gap nicely.`}
      </CoachCard>
    </Screen>
  );
}
