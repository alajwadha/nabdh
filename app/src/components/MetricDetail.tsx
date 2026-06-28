import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../design-system/components';
import { radii, spacing } from '../design-system';
import { useTheme } from '../design-system/theme';
import { BarChart, LineChart } from './Charts';
import { METRICS, type DeltaKind, type MetricDef } from '../data/metrics';
import type { MetricKey } from '../store/app';
import { useHealth } from '../store/health';
import { DEMO_SUMMARY } from '../integrations/demo';
import { readinessBreakdown } from '../data/workouts';
import { weekdayName } from '../data/derive';

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
  const { summary } = useHealth();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);
  const [range, setRange] = useState<'7D' | '30D'>('7D');
  const d = def.detail!;
  const data = range === '7D' ? d.d7 : d.d30;
  // Headline is the REAL current value from the device; only the trend below is
  // illustrative until a real history store exists (clearly labelled SAMPLE).
  const real = def.read?.(s);
  const headline = real != null ? String(real) : def.sample;
  const hasReal = real != null;
  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <AppText variant="h2">{d.title}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {weekdayName()} · {hasReal ? 'measured today' : 'sample value'}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppText style={{ fontSize: 44, fontWeight: '800', letterSpacing: -2 }}>
          {headline}
          {!!def.unit && <AppText variant="title" color={colors.textMuted}>{` ${def.unit}`}</AppText>}
        </AppText>
        {!hasReal && (
          <View style={{ backgroundColor: colors.navBg, borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10 }}>
            <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 10, letterSpacing: 0.5 }}>SAMPLE</AppText>
          </View>
        )}
      </View>

      {/* Trend section — an explicitly-labelled preview, not the user's real history */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <RangeToggle range={range} onChange={setRange} />
        <View style={{ backgroundColor: colors.navBg, borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10 }}>
          <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 10, letterSpacing: 0.5 }}>SAMPLE</AppText>
        </View>
      </View>
      <View style={{ backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.md, gap: spacing.sm }}>
        <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11, lineHeight: 15 }}>
          Example {range === '7D' ? '7-day' : '30-day'} shape — a preview of the chart you’ll get here.
        </AppText>
        {d.bars ? (
          <BarChart data={data} goal={d.goal} color={d.chartColor} />
        ) : (
          <LineChart data={data} baseline={d.base} color={d.chartColor} />
        )}
      </View>
      {/* Honest empty state in place of the old fabricated stat tiles + canned insight */}
      <View style={{ backgroundColor: colors.navOn, borderRadius: radii.xl, padding: spacing.lg, flexDirection: 'row', gap: spacing.md }}>
        <AppText style={{ fontSize: 16 }}>📈</AppText>
        <AppText variant="caption" color={colors.navOnText} style={{ flex: 1, lineHeight: 18 }}>
          Your daily highs and lows, 28-day baseline and personalised insights for {d.title.toLowerCase()} appear here once your device has synced a few days of history.
        </AppText>
      </View>
    </View>
  );
}

const READINESS_STATUS: Record<'good' | 'warn' | 'bad' | 'none', { kind: DeltaKind; tag: string }> = {
  good: { kind: 'good', tag: 'Strong ▲' },
  warn: { kind: 'warn', tag: 'Fair —' },
  bad: { kind: 'bad', tag: 'Low ▼' },
  none: { kind: 'warn', tag: 'No data' },
};

function ReadinessBody() {
  const { colors } = useTheme();
  const { summary } = useHealth();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);
  const { score, factors } = readinessBreakdown(s);
  const present = factors.filter((f) => f.present);
  // Dynamic insight: name the signal helping most and the one hurting most.
  const sorted = [...present].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
  const top = sorted[0];
  const low = sorted[sorted.length - 1];
  const insight = present.length === 0
    ? 'Connect a device with sleep, resting-HR and HRV to see what’s driving your readiness.'
    : top && low && top.key !== low.key && (low.pct ?? 0) < 60
      ? `${top.label} is carrying the score; ${low.label.toLowerCase()} is the drag. Lift the weakest signal and the number follows.`
      : `${top?.label ?? 'Sleep'} is leading and nothing’s dragging hard — keep the rhythm steady.`;
  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <AppText variant="h2">Readiness {score} — why?</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          The exact signals behind your score · sleep 40% · resting HR 30% · HRV 30%
        </AppText>
      </View>
      <View style={{ backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md }}>
        {factors.map((f) => {
          const st = READINESS_STATUS[f.status];
          return (
            <View key={f.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 92 }}>
                <AppText variant="caption" color={colors.textMuted}>{f.label}</AppText>
                <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 10, opacity: 0.7 }}>{f.value}</AppText>
              </View>
              <View style={{ flex: 1, height: 9, borderRadius: 99, backgroundColor: colors.navBg, overflow: 'hidden' }}>
                <View style={{ width: `${f.pct ?? 0}%`, height: '100%', borderRadius: 99, backgroundColor: deltaColor(st.kind, colors) }} />
              </View>
              <AppText variant="caption" color={deltaColor(st.kind, colors)} style={{ width: 84, textAlign: 'right' }}>
                {f.present ? `+${f.points} · ${st.tag}` : st.tag}
              </AppText>
            </View>
          );
        })}
      </View>
      <InsightRow text={insight} />
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
