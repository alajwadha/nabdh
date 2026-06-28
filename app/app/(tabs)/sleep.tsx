import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, Screen } from '../../src/design-system/components';
import { AppHeader } from '../../src/components/AppHeader';
import { CoachCard, MetricTile, TileGrid } from '../../src/components/Dashboard';
import { radii, spacing } from '../../src/design-system';
import { useTheme } from '../../src/design-system/theme';
import { useHealth } from '../../src/store/health';
import { useAppState } from '../../src/store/app';
import { DEMO_SUMMARY } from '../../src/integrations/demo';
import { hoursMinutes, sleepStages, sleepScore, sleepWindow, sleepNeedMin, weekdayName, windDownTimes, cycleBedtimes } from '../../src/data/derive';

const STAGE_COLORS = { deep: '#8E81D6', rem: '#A99DE0', light: '#8FCBAA', awake: '#E0B070' };

export default function Sleep() {
  const { colors, tiles } = useTheme();
  const { summary } = useHealth();
  const { body } = useAppState();
  const [detailed, setDetailed] = useState(false);
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);
  const asleep = s?.sleepMinutes ?? 0;
  const hasSleep = asleep > 0;

  const stages = sleepStages(asleep);
  const score = sleepScore(asleep);
  const { bed, wake } = sleepWindow(stages.inBedMin);
  const needMin = sleepNeedMin(body.age); // age-personalized target
  const debtMin = Math.max(0, needMin - asleep);
  const efficiency = stages.inBedMin > 0 ? Math.round((asleep / stages.inBedMin) * 100) : 0;
  const idealInBed = Math.round(needMin * 1.06);
  const idealBed = sleepWindow(idealInBed).bed; // bedtime to hit the need
  const windDown = windDownTimes(idealInBed); // caffeine/meal/screen cut-offs from that bedtime
  const cycles = cycleBedtimes(7); // cycle-aligned bedtimes for a ~7:00 wake
  // Highlight the option closest to the screen's age-personalized need (not a fixed 7.5h).
  const cycleHighlight = cycles.reduce((best, c, i) => (Math.abs(c.cycles * 90 - needMin) < Math.abs(cycles[best].cycles * 90 - needMin) ? i : best), 0);
  const deepPct = asleep > 0 ? Math.round((stages.deep / asleep) * 100) : 0;
  const remPct = asleep > 0 ? Math.round((stages.rem / asleep) * 100) : 0;

  // No wearable data → an honest connect prompt, not a fabricated 0 score.
  if (!hasSleep) {
    return (
      <Screen>
        <AppHeader />
        <AppText variant="h1" style={{ marginTop: spacing.sm }}>Sleep</AppText>
        <Card>
          <AppText variant="caption" color={colors.textMuted} style={{ lineHeight: 18 }}>
            Connect Apple Health or a device to see last night’s sleep — stages, a score, debt, and your ideal bedtime.
          </AppText>
        </Card>
      </Screen>
    );
  }

  const rows: [string, number][] = [
    ['Deep', stages.deep],
    ['REM', stages.rem],
    ['Light', stages.light],
    ['Awake', stages.awake],
  ];
  const maxStage = Math.max(stages.deep, stages.rem, stages.light, stages.awake, 1);

  const headline =
    score >= 85
      ? 'Strong night — deep and REM both above baseline.'
      : score >= 70
        ? 'Solid structure, but a touch short — recovery beats grind today.'
        : 'Short and broken — go easy and protect tonight.';

  return (
    <Screen>
      <AppHeader />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
        <AppText variant="h1" style={{ flex: 1 }}>Sleep</AppText>
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
      <AppText variant="caption" color={colors.textMuted}>
        {weekdayName()} morning report · {bed} → {wake}
      </AppText>

      <View style={{ backgroundColor: '#4A3F9E', borderRadius: 30, padding: spacing.xl, overflow: 'hidden' }}>
        <AppText variant="caption" color="rgba(255,255,255,0.78)" style={{ letterSpacing: 2 }}>
          SLEEP SCORE
        </AppText>
        <AppText style={{ fontSize: 64, lineHeight: 66, fontWeight: '800', color: '#fff' }}>{score}</AppText>
        <AppText variant="body" color="#fff" style={{ marginTop: 5, fontWeight: '700' }}>
          {hoursMinutes(asleep)} asleep · {headline}
        </AppText>
      </View>

      <Card style={{ gap: 0 }}>
        {rows.map(([name, min], i) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10, borderBottomWidth: i === rows.length - 1 ? 0 : 2, borderBottomColor: colors.border }}>
            <AppText variant="title" style={{ width: 54 }}>
              {name}
            </AppText>
            <View style={{ flex: 1, height: 9, borderRadius: 99, backgroundColor: colors.navBg, overflow: 'hidden' }}>
              <View style={{ width: `${(min / maxStage) * 100}%`, height: '100%', borderRadius: 99, backgroundColor: STAGE_COLORS[name.toLowerCase() as keyof typeof STAGE_COLORS] }} />
            </View>
            <AppText variant="caption" style={{ width: 38, textAlign: 'right' }}>
              {hoursMinutes(min)}
            </AppText>
          </View>
        ))}
      </Card>

      <TileGrid>
        <MetricTile label="Sleep debt" value={debtMin > 0 ? hoursMinutes(debtMin) : '0:00'} unit="h" hint={debtMin > 0 ? 'payable tonight' : 'all paid off'} color="pink" />
        <MetricTile label="Efficiency" value={`${efficiency}`} unit="%" hint="asleep vs in bed" color="peach" />
      </TileGrid>

      <View style={{ backgroundColor: tiles.mint.bg, borderRadius: radii.xl, padding: spacing.lg }}>
        <AppText variant="title" color={tiles.mint.ink}>
          Tonight’s window 🌙
        </AppText>
        <AppText variant="caption" color={tiles.mint.ink} style={{ fontWeight: '600', marginTop: 3, lineHeight: 18 }}>
          Lights out by {idealBed} to get {hoursMinutes(needMin)} before a ~7:00 wake — {debtMin > 0 ? `clears the ${hoursMinutes(debtMin)} debt and pushes HRV back up.` : 'you’re on track; keep the rhythm steady.'}
        </AppText>
      </View>

      <Card style={{ gap: 2 }}>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: 4 }}>WIND-DOWN · FOR {idealBed} LIGHTS-OUT</AppText>
        <WindRow icon="☕️" label="Last qahwa / karak" value={windDown.caffeine} colors={colors} />
        <WindRow icon="🍽️" label="Last heavy meal" value={windDown.meal} colors={colors} />
        <WindRow icon="📵" label="Dim screens" value={windDown.screens} colors={colors} last />
        {detailed && (
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 8, lineHeight: 16 }}>
            Caffeine’s ~5–6 h half-life means an afternoon coffee is still ~25% active at bedtime. 6 h before is the followable floor; 8 h is ideal. Meals ~3 h, screens ~1 h.
          </AppText>
        )}
      </Card>

      <Card>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: 8 }}>SLEEP CYCLES · FOR A ~7:00 WAKE</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {cycles.map((c, i) => {
            const on = i === cycleHighlight;
            return (
              <View key={c.cycles} style={{ flex: 1, alignItems: 'center', backgroundColor: on ? tiles.lav.bg : colors.navBg, borderRadius: radii.lg, paddingVertical: 12 }}>
                <AppText variant="caption" color={on ? tiles.lav.ink : colors.textMuted} style={{ fontSize: 9, letterSpacing: 0.5 }}>{c.cycles} CYCLES · {c.hours}h</AppText>
                <AppText variant="title" color={on ? tiles.lav.ink : colors.ink} style={{ marginTop: 3 }}>{c.time}</AppText>
              </View>
            );
          })}
        </View>
        <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 8, lineHeight: 16 }}>
          Wake between ~90-min cycles, not mid-deep-sleep — why 7½ h can beat 8. Highlighted is closest to your {hoursMinutes(needMin)} need. Cycles are an average (70–120 min), so treat these as a guide.{detailed ? ' Includes ~15 min to drift off.' : ''}
        </AppText>
      </Card>

      {detailed && (
        <Card style={{ gap: spacing.sm }}>
          <DRow label="Deep share" value={`${deepPct}% ${deepPct >= 13 ? '· adequate ✓' : '· low'}`} colors={colors} />
          <DRow label="REM share" value={`${remPct}% ${remPct >= 20 ? '· adequate ✓' : '· low'}`} colors={colors} />
          <DRow label={`Sleep need (age ${body.age})`} value={hoursMinutes(needMin)} colors={colors} />
          <DRow label="Ideal lights-out" value={`${idealBed} · ~7:00 wake`} colors={colors} last />
        </Card>
      )}

      <CoachCard>
        {score >= 80
          ? 'Structure’s great — keep bedtime steady and mind the wind-down cut-offs to hold this.'
          : 'Structure’s fine, recovery isn’t. Lights out early — the wind-down card above has tonight’s cut-offs.'}
      </CoachCard>
    </Screen>
  );
}

function DRow({ label, value, colors, last }: { label: string; value: string; colors: ReturnType<typeof useTheme>['colors']; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: last ? 0 : 2, borderBottomColor: colors.border }}>
      <AppText variant="caption" color={colors.textMuted}>{label}</AppText>
      <AppText variant="title" style={{ fontSize: 14 }}>{value}</AppText>
    </View>
  );
}

function WindRow({ icon, label, value, colors, last }: { icon: string; label: string; value: string; colors: ReturnType<typeof useTheme>['colors']; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: last ? 0 : 2, borderBottomColor: colors.border }}>
      <AppText style={{ fontSize: 16 }}>{icon}</AppText>
      <AppText variant="caption" color={colors.ink} style={{ flex: 1, fontWeight: '600' }}>{label}</AppText>
      <AppText variant="title" style={{ fontSize: 14 }}>by {value}</AppText>
    </View>
  );
}
