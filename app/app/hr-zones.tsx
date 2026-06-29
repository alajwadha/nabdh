import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Canvas, Rect } from '@shopify/react-native-skia';
import { AppText, Button, Card, Screen, Sheet } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { useAppState } from '../src/store/app';
import { fmtClock } from '../src/services/geo';
import { ZONES, maxHrFromAge, pctOf, pctOfMax, timeInZones, zoneBpm, zoneIndexForHr } from '../src/services/hr';

const KEY = 'nabdh.hr.maxOverride';

function ZoneBar({ secs, total }: { secs: number[]; total: number }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const H = 16;
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  let x = 0;
  const segs = ZONES.map((z, i) => {
    const width = total > 0 && w > 0 ? (secs[i] / total) * w : 0;
    const seg = { x, width, color: z.color };
    x += width;
    return seg;
  });
  return (
    <View onLayout={onLayout} style={{ width: '100%', height: H, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.navBg }}>
      {w > 0 && total > 0 && (
        <Canvas style={{ width: w, height: H }}>
          {segs.map((s, i) => (s.width > 0 ? <Rect key={i} x={s.x} y={0} width={s.width} height={H} color={s.color} /> : null))}
        </Canvas>
      )}
    </View>
  );
}

export default function HrZones() {
  const { colors } = useTheme();
  const router = useRouter();
  const { body } = useAppState();

  const [override, setOverride] = useState<number | null>(null);
  const maxHr = override ?? maxHrFromAge(body.age);

  const [live, setLive] = useState(false);
  const [currentHr, setCurrentHr] = useState<number | null>(null);
  const [, force] = useState(0); // re-render as samples accrue
  const samples = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [draftMax, setDraftMax] = useState(maxHr);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 120 && n <= 220) setOverride(n);
      }
    });
  }, []);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stopTimer, []);

  const start = () => {
    samples.current = [];
    setCurrentHr(Math.round(maxHr * 0.55));
    setLive(true);
    let hr = maxHr * 0.55;
    let target = maxHr * 0.7;
    timer.current = setInterval(() => {
      // Simulated random walk that drifts between easy and hard, clearly a SAMPLE,
      // not a real strap reading (labelled in the UI).
      if (Math.random() < 0.06) target = maxHr * (0.55 + Math.random() * 0.4);
      hr += (target - hr) * 0.08 + (Math.random() * 8 - 4);
      hr = Math.max(maxHr * 0.45, Math.min(maxHr * 0.98, hr));
      const v = Math.round(hr);
      samples.current.push(v);
      setCurrentHr(v);
      force((n) => n + 1);
    }, 1000);
  };

  const stop = () => {
    stopTimer();
    setLive(false);
  };

  const reset = () => {
    stopTimer();
    setLive(false);
    samples.current = [];
    setCurrentHr(null);
    force((n) => n + 1);
  };

  const saveMax = (v: number | null) => {
    setOverride(v);
    if (v == null) AsyncStorage.removeItem(KEY).catch(() => {});
    else AsyncStorage.setItem(KEY, String(v)).catch(() => {});
    setEditOpen(false);
  };

  const secs = useMemo(() => timeInZones(samples.current, maxHr), [maxHr, currentHr, live]);
  const total = secs.reduce((a, b) => a + b, 0);
  const zi = currentHr != null ? zoneIndexForHr(currentHr, maxHr) : -1;
  const curZone = zi >= 0 ? ZONES[zi] : null;

  return (
    <Screen scroll={!live}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => (live ? stop() : router.back())} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={live ? 'x' : 'chevron-left'} size={live ? 20 : 22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Heart-rate zones</AppText>
      </View>

      {/* current BPM hero */}
      <Card style={{ alignItems: 'center', gap: 2, paddingVertical: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="heart-pulse" size={20} color={curZone ? curZone.color : colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>{live ? 'LIVE · SAMPLE' : 'CURRENT'}</AppText>
        </View>
        <AppText variant="metric" style={{ fontSize: 68, lineHeight: 72 }} color={colors.ink}>{currentHr ?? '-'}</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1 }}>BPM</AppText>
        {curZone ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: curZone.color }} />
            <AppText variant="title" color={colors.ink}>{curZone.name} · {pctOfMax(currentHr!, maxHr)}% max</AppText>
          </View>
        ) : (
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6, textAlign: 'center' }}>Start a sample session to watch your zone in real time.</AppText>
        )}
      </Card>

      {/* time-in-zone stacked bar */}
      {total > 0 && (
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4 }}>TIME IN ZONE</AppText>
            <AppText variant="caption" color={colors.textMuted}>{fmtClock(total)} total</AppText>
          </View>
          <ZoneBar secs={secs} total={total} />
        </Card>
      )}

      {/* per-zone rows */}
      <Card style={{ gap: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4 }}>ZONES</AppText>
          <Pressable onPress={() => { setDraftMax(maxHr); setEditOpen(true); }} hitSlop={8}>
            <AppText variant="caption" color={colors.accentText}>Max {maxHr} bpm · edit</AppText>
          </Pressable>
        </View>
        {ZONES.map((z, i) => {
          const { lo, hi } = zoneBpm(z, maxHr);
          const p = pctOf(secs[i], total);
          const here = i === zi;
          return (
            <View key={z.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: z.color, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="caption" color="#fff" style={{ fontWeight: '800' }}>{i + 1}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppText variant="title" style={{ fontSize: 14.5 }}>{z.name}</AppText>
                  {here && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: z.color }} />}
                </View>
                <AppText variant="caption" color={colors.textMuted}>{lo}-{hi} bpm</AppText>
                {total > 0 && (
                  <View style={{ height: 4, borderRadius: 99, backgroundColor: colors.navBg, marginTop: 5, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(p > 0 ? 3 : 0, p)}%`, height: '100%', backgroundColor: z.color }} />
                  </View>
                )}
              </View>
              {total > 0 && (
                <View style={{ alignItems: 'flex-end', minWidth: 56 }}>
                  <AppText variant="metric" style={{ fontSize: 15, lineHeight: 18 }}>{fmtClock(secs[i])}</AppText>
                  <AppText variant="caption" color={colors.textMuted}>{p}%</AppText>
                </View>
              )}
            </View>
          );
        })}
      </Card>

      {/* controls */}
      {!live && total === 0 && <Button label="Start sample session" onPress={start} />}
      {live && <Button label="Stop" variant="dark" onPress={stop} />}
      {!live && total > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Button label="Resume sample" onPress={start} />
          <Button label="Clear" variant="line" onPress={reset} />
        </View>
      )}

      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        This is a simulated sample so you can see how zones work, pair a heart-rate strap or watch for live readings.
      </AppText>

      <Sheet visible={editOpen} onClose={() => setEditOpen(false)}>
        <AppText variant="h2" style={{ marginBottom: spacing.sm }}>Max heart rate</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.lg }}>
          Defaults to 220 - your age ({maxHrFromAge(body.age)} bpm). Set it manually if you know your tested max.
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <Pressable onPress={() => setDraftMax((m) => Math.max(120, m - 1))} hitSlop={6} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="minus" size={18} color={colors.textSecondary} />
          </Pressable>
          <AppText variant="metric" style={{ fontSize: 36, lineHeight: 40, minWidth: 90, textAlign: 'center' }}>{draftMax}</AppText>
          <Pressable onPress={() => setDraftMax((m) => Math.min(220, m + 1))} hitSlop={6} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Button label="Save" onPress={() => saveMax(draftMax)} />
        <View style={{ height: spacing.sm }} />
        <Button label={`Use age (${maxHrFromAge(body.age)} bpm)`} variant="line" onPress={() => saveMax(null)} />
      </Sheet>
    </Screen>
  );
}
