import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Card, Screen, SectionHeader } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { useAppState } from '../src/store/app';
import { useHealth } from '../src/store/health';
import { DEMO_SUMMARY } from '../src/integrations/demo';
import { bmi, hrZones, maxHr } from '../src/data/health-metrics';

const ZONE_COLORS = ['blue', 'mint', 'gold', 'peach', 'pink'] as const;

export default function Body() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { body, setBody } = useAppState();
  const { summary } = useHealth();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);
  const [detailed, setDetailed] = useState(false);
  const hasVitals = !!(s && (s.restingHeartRate != null || s.hrvSdnn != null || s.spo2 != null));

  const b = bmi(body.weightKg, body.heightCm);
  const mhr = maxHr(body.age);
  const zones = hrZones(body.age);
  const bmiBandColor = b.band === 'Healthy' ? tiles.mint : b.band === 'Underweight' ? tiles.blue : b.band === 'Overweight' ? tiles.gold : tiles.pink;
  // BMI gauge on a 15–40 scale (severe obesity is common in-market — don't cap at 35)
  const bmiPos = Math.max(0, Math.min(100, ((b.value - 15) / 25) * 100));

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
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

      {/* resting vitals — never fabricate; show a connect prompt without real data */}
      {hasVitals ? (
        <View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Vital label="REST HR" value={s?.restingHeartRate} unit="bpm" color={tiles.peach} />
            <Vital label="HRV" value={s?.hrvSdnn} unit="ms" color={tiles.lav} />
            <Vital label="BLOOD O₂" value={s?.spo2} unit="%" color={tiles.blue} />
          </View>
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6, marginLeft: 2 }}>From your last overnight sync.</AppText>
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
          {/* 15–40 scale: healthy 18.5–25 (14–40%), overweight 25–30 (40–60%), obese 30–40 (60–100%) */}
          <View style={{ position: 'absolute', left: '14%', width: '26%', top: 0, bottom: 0, backgroundColor: colors.accent, opacity: 0.4 }} />
          <View style={{ position: 'absolute', left: '40%', width: '20%', top: 0, bottom: 0, backgroundColor: '#E0A24E', opacity: 0.45 }} />
          <View style={{ position: 'absolute', left: '60%', width: '40%', top: 0, bottom: 0, backgroundColor: colors.danger, opacity: 0.4 }} />
          <View style={{ position: 'absolute', left: `${Math.min(98, bmiPos)}%`, width: 3, top: 0, bottom: 0, backgroundColor: colors.ink }} />
        </View>
        <AppText variant="caption" color={bmiBandColor.ink} style={{ marginTop: 6, opacity: 0.8 }}>
          BMI doesn’t account for muscle — a lean lifter can read high.
        </AppText>
        {detailed && (
          <AppText variant="caption" color={bmiBandColor.ink} style={{ marginTop: 4, opacity: 0.85 }}>
            BMI = weight ÷ height² = {body.weightKg} ÷ ({(body.heightCm / 100).toFixed(2)})² · healthy 18.5–25
          </AppText>
        )}
      </View>

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
              <AppText variant="caption" color={colors.textMuted}>{z.lo}–{z.hi} bpm</AppText>
            </View>
          );
        })}
        {detailed && (
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
            Max HR via Tanaka (208 − 0.7 × age). Zones are % of max — train Z2 for base, Z4–5 sparingly.
          </AppText>
        )}
      </Card>

      {/* body profile (editable in detailed) */}
      {detailed && (
        <>
          <SectionHeader title="Your body" />
          <Card>
            <Stepper label="Age" value={body.age} unit="yrs" onMinus={() => setBody({ age: Math.max(12, body.age - 1) })} onPlus={() => setBody({ age: body.age + 1 })} colors={colors} />
            <Stepper label="Height" value={body.heightCm} unit="cm" onMinus={() => setBody({ heightCm: Math.max(120, body.heightCm - 1) })} onPlus={() => setBody({ heightCm: body.heightCm + 1 })} colors={colors} />
            <Stepper label="Weight" value={body.weightKg} unit="kg" onMinus={() => setBody({ weightKg: Math.max(35, body.weightKg - 1) })} onPlus={() => setBody({ weightKg: body.weightKg + 1 })} colors={colors} last />
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
        <AppText variant="h2" style={{ fontSize: 20 }}>{value != null ? value : '—'}</AppText>
        {value != null && <AppText variant="caption" color={color.ink} style={{ marginBottom: 3, fontSize: 10 }}>{unit}</AppText>}
      </View>
    </View>
  );
}

function Stepper({ label, value, unit, onMinus, onPlus, colors, last }: { label: string; value: number; unit: string; onMinus: () => void; onPlus: () => void; colors: ReturnType<typeof useTheme>['colors']; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: last ? 0 : 2, borderBottomColor: colors.border }}>
      <AppText variant="title" style={{ fontSize: 14 }}>{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={onMinus} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}><AppText style={{ fontSize: 16 }}>−</AppText></Pressable>
        <View style={{ minWidth: 64, alignItems: 'center' }}><AppText variant="title">{value} <AppText variant="caption" color={colors.textMuted}>{unit}</AppText></AppText></View>
        <Pressable onPress={onPlus} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}><AppText style={{ fontSize: 16 }}>＋</AppText></Pressable>
      </View>
    </View>
  );
}
