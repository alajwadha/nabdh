import { View } from 'react-native';
import { AppText, Card, Screen } from '../../src/design-system/components';
import { AppHeader } from '../../src/components/AppHeader';
import { CoachCard, MetricTile, TileGrid } from '../../src/components/Dashboard';
import { radii, spacing } from '../../src/design-system';
import { useTheme } from '../../src/design-system/theme';

const STAGES: [string, string, number, string][] = [
  ['Deep', '1:24', 0.64, '#8E81D6'],
  ['REM', '1:51', 0.84, '#A99DE0'],
  ['Light', '3:39', 0.9, '#8FCBAA'],
  ['Awake', '0:24', 0.12, '#E0B070'],
];

export default function Sleep() {
  const { colors, tiles } = useTheme();
  return (
    <Screen>
      <AppHeader />
      <AppText variant="h1" style={{ marginTop: spacing.sm }}>
        Sleep
      </AppText>
      <AppText variant="caption" color={colors.textMuted}>
        Thursday morning report · 11:42 PM → 7:00 AM
      </AppText>

      <View style={{ backgroundColor: '#4A3F9E', borderRadius: 30, padding: spacing.xl, overflow: 'hidden' }}>
        <AppText variant="caption" color="rgba(255,255,255,0.78)" style={{ letterSpacing: 2 }}>
          SLEEP SCORE
        </AppText>
        <AppText style={{ fontSize: 64, lineHeight: 66, fontWeight: '800', color: '#fff' }}>82</AppText>
        <AppText variant="body" color="#fff" style={{ marginTop: 5, fontWeight: '700' }}>
          Your best structure this week — deep and REM both above baseline.
        </AppText>
      </View>

      <Card style={{ gap: 0 }}>
        {STAGES.map(([name, val, w, color], i) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10, borderBottomWidth: i === STAGES.length - 1 ? 0 : 2, borderBottomColor: colors.border }}>
            <AppText variant="title" style={{ width: 54 }}>
              {name}
            </AppText>
            <View style={{ flex: 1, height: 9, borderRadius: 99, backgroundColor: colors.navBg, overflow: 'hidden' }}>
              <View style={{ width: `${w * 100}%`, height: '100%', borderRadius: 99, backgroundColor: color }} />
            </View>
            <AppText variant="caption" style={{ width: 38, textAlign: 'right' }}>
              {val}
            </AppText>
          </View>
        ))}
      </Card>

      <TileGrid>
        <MetricTile label="Sleep debt" value="1:40" unit="h" hint="payable tonight" color="pink" />
        <MetricTile label="Consistency" value="±38" unit="min" hint="bedtime drift" color="peach" />
      </TileGrid>

      <View style={{ backgroundColor: tiles.mint.bg, borderRadius: radii.xl, padding: spacing.lg }}>
        <AppText variant="title" color={tiles.mint.ink}>
          Tonight’s window 🌙
        </AppText>
        <AppText variant="caption" color={tiles.mint.ink} style={{ fontWeight: '600', marginTop: 3, lineHeight: 18 }}>
          Ideal bedtime 11:15–11:35 · wake 6:45 · 7h 30m — enough to pay the debt and push HRV back up.
        </AppText>
      </View>

      <CoachCard>Structure’s great, recovery isn’t. Lights out 11:15, no karak after 6.</CoachCard>
    </Screen>
  );
}
