import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../design-system/components';
import { radii, spacing } from '../design-system';
import { useTheme } from '../design-system/theme';
import { BarChart, LineChart } from './Charts';
import { METRICS, type DeltaKind, type MetricDef } from '../data/metrics';
import type { MetricKey } from '../store/app';

function deltaColor(kind: DeltaKind, c: ReturnType<typeof useTheme>['colors']): string {
  return kind === 'good' ? c.accentText : kind === 'bad' ? c.danger : c.warning;
}

function InsightRow({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, backgroundColor: colors.navOn, borderRadius: radii.xl, padding: spacing.lg }}>
      <View style={{ width: 35, height: 35, borderRadius: 18, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}>
        <AppText style={{ fontSize: 16 }}>💡</AppText>
      </View>
      <AppText variant="body" color={colors.navOnText} style={{ flex: 1, fontSize: 12.5, lineHeight: 19 }}>
        {text}
      </AppText>
    </View>
  );
}

function SubTile({ label, value, color }: { label: string; value: string; color: 'mint' | 'lav' }) {
  const { tiles } = useTheme();
  const c = tiles[color];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, borderRadius: radii.xl, padding: spacing.lg }}>
      <AppText variant="caption" color={c.ink} style={{ letterSpacing: 1.2 }}>
        {label}
      </AppText>
      <AppText variant="h2" style={{ marginTop: 4 }}>
        {value}
      </AppText>
    </View>
  );
}

function RangeToggle({ range, onChange }: { range: '7D' | '30D'; onChange: (r: '7D' | '30D') => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: 99, padding: 4, alignSelf: 'flex-start' }}>
      {(['7D', '30D'] as const).map((r) => (
        <Pressable key={r} onPress={() => onChange(r)} style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 99, backgroundColor: range === r ? colors.navOn : 'transparent' }}>
          <AppText variant="caption" color={range === r ? colors.navOnText : colors.textMuted}>
            {r === '7D' ? '7 days' : '30 days'}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

function FullDetail({ def }: { def: MetricDef }) {
  const { colors } = useTheme();
  const [range, setRange] = useState<'7D' | '30D'>('7D');
  const d = def.detail!;
  const data = range === '7D' ? d.d7 : d.d30;
  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <AppText variant="h2">{d.title}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          Thursday · compared to your 28-day baseline
        </AppText>
      </View>
      <AppText style={{ fontSize: 44, fontWeight: '800', letterSpacing: -2 }}>
        {def.sample}
        {!!def.unit && <AppText variant="title" color={colors.textMuted}>{` ${def.unit}`}</AppText>}
      </AppText>
      <AppText variant="caption" color={deltaColor(d.deltaKind, colors)} style={{ fontSize: 12 }}>
        {d.delta}
      </AppText>
      <RangeToggle range={range} onChange={setRange} />
      <View style={{ backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.md }}>
        {d.bars ? (
          <BarChart data={data} goal={d.goal} color={d.chartColor} />
        ) : (
          <LineChart data={data} baseline={d.base} color={d.chartColor} />
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <SubTile label={d.tiles[0][0]} value={d.tiles[0][1]} color="mint" />
        <SubTile label={d.tiles[1][0]} value={d.tiles[1][1]} color="lav" />
      </View>
      <InsightRow text={d.ins} />
    </View>
  );
}

function ReadinessBody() {
  const { colors } = useTheme();
  const rows: [string, number, string, DeltaKind][] = [
    ['Sleep', 0.84, 'Good ▲', 'good'],
    ['HRV balance', 0.34, 'Attention ▼', 'bad'],
    ['Resting HR', 0.42, 'Elevated ▼', 'bad'],
    ['Activity load', 0.76, 'Light ✓', 'good'],
    ['Consistency', 0.6, 'Fair —', 'warn'],
  ];
  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <AppText variant="h2">Readiness 64 — why?</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          Score contributors · what’s helping and what’s hurting
        </AppText>
      </View>
      <View style={{ backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md }}>
        {rows.map(([k, w, status, kind]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <AppText variant="caption" color={colors.textMuted} style={{ width: 92 }}>
              {k}
            </AppText>
            <View style={{ flex: 1, height: 9, borderRadius: 99, backgroundColor: colors.navBg, overflow: 'hidden' }}>
              <View style={{ width: `${w * 100}%`, height: '100%', borderRadius: 99, backgroundColor: deltaColor(kind, colors) }} />
            </View>
            <AppText variant="caption" color={deltaColor(kind, colors)} style={{ width: 84, textAlign: 'right' }}>
              {status}
            </AppText>
          </View>
        ))}
      </View>
      <InsightRow text="Sleep is carrying the score; your nervous system is dragging it down. One easy day + an early night usually returns you to the mid-70s." />
    </View>
  );
}

export function MetricDetailBody({ metricKey }: { metricKey: MetricKey | 'readiness' }) {
  if (metricKey === 'readiness') return <ReadinessBody />;
  const def = METRICS[metricKey];
  if (!def.detail) {
    const { colors } = useTheme();
    return (
      <View style={{ gap: spacing.sm }}>
        <AppText variant="h2">{def.label}</AppText>
        <AppText variant="display">{def.sample}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {def.hint}
        </AppText>
      </View>
    );
  }
  return <FullDetail def={def} />;
}
