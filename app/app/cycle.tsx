import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Canvas, Path, Skia, Circle } from '@shopify/react-native-skia';
import { AppText, Button, Screen } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { useCycle } from '../src/store/cycle';
import { cycleInfo, phaseForDay, PHASE_META, dayKey, type Phase } from '../src/data/cycle';

// Phase ring: a donut where each cycle day is an arc, coloured by its phase, with a marker
// at today. Clinical, not cute.
function PhaseRing({ size, cycleLen, periodLen, today }: { size: number; cycleLen: number; periodLen: number; today: number }) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 14;
  const stroke = 16;
  const arcs = [];
  for (let d = 1; d <= cycleLen; d++) {
    const a0 = (-90 + ((d - 1) / cycleLen) * 360) * (Math.PI / 180);
    const a1 = (-90 + (d / cycleLen) * 360 - 1.5) * (Math.PI / 180);
    const p = Skia.Path.Make();
    p.moveTo(cx + r * Math.cos(a0), cy + r * Math.sin(a0));
    p.addArc({ x: cx - r, y: cy - r, width: 2 * r, height: 2 * r }, (-90 + ((d - 1) / cycleLen) * 360), (1 / cycleLen) * 360 - 1.5);
    const ph = phaseForDay(d, cycleLen, periodLen);
    arcs.push({ p, color: PHASE_META[ph].color, on: d === today });
  }
  const ma = (-90 + ((today - 0.5) / cycleLen) * 360) * (Math.PI / 180);
  return (
    <Canvas style={{ width: size, height: size }}>
      {arcs.map((a, i) => (
        <Path key={i} path={a.p} style="stroke" strokeWidth={a.on ? stroke + 7 : stroke} strokeCap="butt" color={a.color} opacity={a.on ? 1 : 0.5} />
      ))}
      <Circle cx={cx + r * Math.cos(ma)} cy={cy + r * Math.sin(ma)} r={6} color="#1F1C17" />
      <Circle cx={cx + r * Math.cos(ma)} cy={cy + r * Math.sin(ma)} r={3} color="#fff" />
    </Canvas>
  );
}

export default function Cycle() {
  const { colors } = useTheme();
  const router = useRouter();
  const { periods, logPeriodStart } = useCycle();
  const info = cycleInfo(periods);

  const Legend = ({ phase }: { phase: Phase }) => {
    const m = PHASE_META[phase];
    const active = info?.phase === phase;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: active ? 1 : 0.6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: m.color }} />
        <AppText variant="caption" color={active ? colors.ink : colors.textMuted} style={{ fontWeight: active ? '800' : '600' }}>{m.label}</AppText>
      </View>
    );
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Cycle</AppText>
      </View>

      {!info ? (
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.md, alignItems: 'center', shadowColor: '#3A2E1A', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}>
          <Icon name="calendar" size={30} color={colors.textMuted} />
          <AppText variant="title" style={{ textAlign: 'center' }}>Track your cycle</AppText>
          <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center', lineHeight: 18 }}>
            Log when your period starts and Nabdh maps your phases, predicts the next one, and tunes training advice to where you are.
          </AppText>
          <Button label="Log period started today" onPress={() => logPeriodStart()} />
        </View>
      ) : (
        <>
          {/* phase ring + today */}
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg, alignItems: 'center', shadowColor: '#3A2E1A', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}>
            <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
              <PhaseRing size={220} cycleLen={info.cycleLen} periodLen={info.periodLen} today={info.day} />
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>CYCLE DAY</AppText>
                <AppText variant="metric" style={{ fontSize: 52, lineHeight: 56 }}>{info.day}</AppText>
                <AppText variant="title" color={PHASE_META[info.phase].color}>{PHASE_META[info.phase].label}</AppText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center', marginTop: spacing.sm }}>
              {(['menstrual', 'follicular', 'ovulation', 'luteal'] as Phase[]).map((p) => <Legend key={p} phase={p} />)}
            </View>
          </View>

          {/* training note */}
          <View style={{ backgroundColor: colors.accentDeep, borderRadius: radii.xl, padding: spacing.lg, flexDirection: 'row', gap: spacing.md }}>
            <Icon name="dumbbell" size={20} color="#fff" />
            <View style={{ flex: 1 }}>
              <AppText variant="title" color="#fff">{PHASE_META[info.phase].label} phase</AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.9)" style={{ lineHeight: 18, marginTop: 2 }}>{PHASE_META[info.phase].train}</AppText>
            </View>
          </View>

          {/* predictions */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Stat icon="calendar" tintless label="NEXT PERIOD" value={`${info.daysUntilNext}`} sub={info.daysUntilNext === 1 ? 'day' : 'days'} colors={colors} />
            <Stat icon="heart-pulse" tintless label="FERTILE WINDOW" value={`${info.fertile[0]}–${info.fertile[1]}`} sub="cycle days" colors={colors} />
          </View>
          <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
            Avg cycle {info.cycleLen} days · period {info.periodLen} days · next on {info.nextStart.slice(5)}
          </AppText>

          <Button label="Log period started today" variant="line" onPress={() => logPeriodStart(dayKey())} />
          <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>Estimates only — not contraception or medical advice.</AppText>
        </>
      )}
    </Screen>
  );
}

function Stat({ icon, label, value, sub, colors }: { icon: 'calendar' | 'heart-pulse'; tintless?: boolean; label: string; value: string; sub: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, gap: 4, shadowColor: '#3A2E1A', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={15} color={colors.textMuted} />
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1 }}>{label}</AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
        <AppText variant="metric" style={{ fontSize: 30, lineHeight: 32 }}>{value}</AppText>
        <AppText variant="caption" color={colors.textMuted}>{sub}</AppText>
      </View>
    </View>
  );
}
