import { View } from 'react-native';
import { AppText, Card, Screen } from '../../src/design-system/components';
import { AppHeader } from '../../src/components/AppHeader';
import { CoachCard, MetricTile, TileGrid } from '../../src/components/Dashboard';
import { radii, spacing } from '../../src/design-system';
import { useTheme } from '../../src/design-system/theme';
import { useHealth } from '../../src/store/health';
import { DEMO_SUMMARY } from '../../src/integrations/demo';
import { hoursMinutes, sleepStages, sleepScore, sleepWindow, weekdayName } from '../../src/data/derive';

const STAGE_COLORS = { deep: '#8E81D6', rem: '#A99DE0', light: '#8FCBAA', awake: '#E0B070' };
const SLEEP_GOAL_MIN = 480; // 8h target

export default function Sleep() {
  const { colors, tiles } = useTheme();
  const { summary } = useHealth();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);
  const asleep = s?.sleepMinutes ?? 0;

  const stages = sleepStages(asleep);
  const score = sleepScore(asleep);
  const { bed, wake } = sleepWindow(stages.inBedMin);
  const debtMin = Math.max(0, SLEEP_GOAL_MIN - asleep);
  const efficiency = stages.inBedMin > 0 ? Math.round((asleep / stages.inBedMin) * 100) : 0;

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
      <AppText variant="h1" style={{ marginTop: spacing.sm }}>
        Sleep
      </AppText>
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
          Aim for {hoursMinutes(SLEEP_GOAL_MIN)} in bed — {debtMin > 0 ? `that clears the ${hoursMinutes(debtMin)} debt and pushes HRV back up.` : 'you’re on track; keep the rhythm steady.'}
        </AppText>
      </View>

      <CoachCard>
        {score >= 80
          ? 'Structure’s great — keep bedtime steady and skip late karak to hold this.'
          : 'Structure’s fine, recovery isn’t. Lights out early, no karak after 6.'}
      </CoachCard>
    </Screen>
  );
}
