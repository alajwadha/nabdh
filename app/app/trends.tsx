import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '../src/design-system/components';
import { Sparkline } from '../src/components/Charts';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';

type Trend = { nm: string; v: string; u: string; dl: string; up: boolean; color: string; w: number[]; m: number[] };

const TRENDS: Trend[] = [
  { nm: 'Readiness', v: '68', u: 'avg', dl: '▲ 5', up: true, color: '#2E7D5B', w: [62, 70, 66, 58, 64, 72, 68], m: [60, 64, 62, 58, 66, 70, 68, 64, 62, 66, 70, 68, 72, 68] },
  { nm: 'Sleep score', v: '76', u: 'avg', dl: '▲ 8', up: true, color: '#8E81D6', w: [70, 74, 68, 80, 72, 78, 82], m: [68, 72, 70, 74, 76, 78, 74, 72, 76, 80, 78, 82, 80, 76] },
  { nm: 'HRV', v: '52', u: 'ms', dl: '▼ 4', up: false, color: '#8E81D6', w: [56, 58, 54, 57, 52, 50, 48], m: [58, 57, 55, 56, 54, 55, 53, 54, 52, 51, 50, 49, 50, 48] },
  { nm: 'Resting HR', v: '56', u: 'bpm', dl: '▲ 4', up: false, color: '#E08A50', w: [54, 55, 56, 55, 57, 58, 58], m: [53, 54, 55, 54, 56, 55, 57, 56, 58, 57, 58, 57, 58, 58] },
  { nm: 'Steps', v: '8.7k', u: 'avg', dl: '▲ 6%', up: true, color: '#2E7D5B', w: [9.2, 11.4, 7.8, 10.5, 8.9, 12.1, 8.4], m: [8.2, 9.5, 7.4, 10.2, 11, 9.8, 8.6, 7.9, 10.4, 9.1, 8.8, 11.6, 12.1, 8.4] },
];

const SUMMARY: Record<'W' | 'M' | '6M', string> = {
  W: 'Sleep is recovering (+24 min/night) but resting HR crept up 4 bpm after three late dinners. One disciplined week pulls both back.',
  M: 'Over the month the trend is healthy: sleep up, steps up. HRV is the one to watch — protect bedtime.',
  '6M': 'Six-month view: steady gains in fitness (VO₂ +2) and sleep consistency. Your strongest stretch was this spring.',
};

export default function Trends() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const [range, setRange] = useState<'W' | 'M' | '6M'>('W');

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: 18 }}>‹</AppText>
        </Pressable>
        <AppText variant="h1">Trends</AppText>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: 99, padding: 4, alignSelf: 'flex-start' }}>
        {(['W', 'M', '6M'] as const).map((r) => (
          <Pressable key={r} onPress={() => setRange(r)} style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 99, backgroundColor: range === r ? colors.navOn : 'transparent' }}>
            <AppText variant="caption" color={range === r ? colors.navOnText : colors.textMuted}>
              {r === 'W' ? 'Week' : r === 'M' ? 'Month' : '6 months'}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={{ backgroundColor: tiles.gold.bg, borderRadius: radii.lg, padding: spacing.lg }}>
        <AppText variant="title" color={tiles.gold.ink}>
          📈 This {range === 'W' ? 'week' : range === 'M' ? 'month' : 'half-year'} in a line
        </AppText>
        <AppText variant="caption" color={tiles.gold.ink} style={{ fontWeight: '600', marginTop: 4, lineHeight: 18 }}>
          {SUMMARY[range]}
        </AppText>
      </View>

      {TRENDS.map((tr) => (
        <Card key={tr.nm}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="title">{tr.nm}</AppText>
            <AppText variant="caption" color={tr.up ? colors.accentText : colors.warning}>
              {tr.dl}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="h2">
              {tr.v} <AppText variant="caption" color={colors.textMuted}>{tr.u}</AppText>
            </AppText>
            <Sparkline data={range === 'W' ? tr.w : tr.m} color={tr.color} />
          </View>
        </Card>
      ))}

      <Button label="✨ See your weekly recap" variant="solid" onPress={() => router.navigate('/wrapped')} />
    </Screen>
  );
}
