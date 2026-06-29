import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { AppText, Button, Card, Screen, SegmentedControl } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon, type IconName } from '../src/components/Icon';
import { useWorkouts } from '../src/store/workouts';
import { useAppState } from '../src/store/app';
import { SPORTS, metCalories } from '../src/data/workouts';
import {
  fmtClock,
  haversine,
  normalize,
  paceSecPerKm,
  recentPaceSecPerKm,
  routeDistanceKm,
  elevationGainM,
  speedKmh,
  type GeoPoint,
} from '../src/services/geo';
import { ensurePermission, locationAvailable, watchPosition, type Subscription } from '../src/services/location';
import { displayDistance, displaySpeed, displayPace, distanceUnit, speedUnit } from '../src/services/units';

type Status = 'idle' | 'tracking' | 'paused' | 'done';
const GPS_SPORTS = SPORTS.filter((s) => s.gps); // running, walking, cycling
const SPORT_ICON: Record<string, IconName> = { running: 'footprints', walking: 'footprints', cycling: 'bike' };

function RouteTrace({ pts, width, height }: { pts: GeoPoint[]; width: number; height: number }) {
  const { colors } = useTheme();
  const xy = useMemo(() => normalize(pts, width, height, 18), [pts, width, height]);
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    let started = false;
    for (let i = 0; i < xy.length; i++) {
      const sameSeg = i > 0 && pts[i].seg === pts[i - 1].seg;
      if (!started || !sameSeg) {
        p.moveTo(xy[i].x, xy[i].y); // lift the pen across a pause gap
        started = true;
      } else {
        p.lineTo(xy[i].x, xy[i].y);
      }
    }
    return p;
  }, [xy, pts]);

  if (pts.length < 2) {
    return (
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon name="map-pin" size={26} color={colors.textMuted} />
        <AppText variant="caption" color={colors.textMuted}>Waiting for GPS fix…</AppText>
      </View>
    );
  }
  const start = xy[0];
  const end = xy[xy.length - 1];
  return (
    <Canvas style={{ width, height }}>
      <Path path={path} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round" color={colors.accent} antiAlias />
      <Circle cx={start.x} cy={start.y} r={6} color={colors.accent} opacity={0.35} />
      <Circle cx={end.x} cy={end.y} r={6} color={colors.accent} />
      <Circle cx={end.x} cy={end.y} r={3} color="#fff" />
    </Canvas>
  );
}

function Metric({ value, label, accent }: { value: string; label: string; accent?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="metric" style={{ fontSize: 30, lineHeight: 34 }} color={accent ?? colors.ink}>{value}</AppText>
      <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 0.6 }}>{label}</AppText>
    </View>
  );
}

export default function Track() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { addSession } = useWorkouts();
  const { body, units } = useAppState();

  const [sportKey, setSportKey] = useState('running');
  const sport = GPS_SPORTS.find((s) => s.key === sportKey) ?? GPS_SPORTS[0];
  const isRide = sport.key === 'cycling';

  const [status, setStatus] = useState<Status>('idle');
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [elapsed, setElapsed] = useState(0); // seconds, excludes paused time
  const [perm, setPerm] = useState<'unknown' | 'denied' | 'unavailable'>('unknown');
  const [discarded, setDiscarded] = useState(false);

  const sub = useRef<Subscription | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const accumRef = useRef(0); // seconds banked before the current running segment
  const segStartRef = useRef(0); // epoch ms when the current segment started
  const segRef = useRef(0); // current route-segment id (bumped on each resume)

  const stopWatch = () => {
    sub.current?.remove();
    sub.current = null;
  };
  const stopTicker = () => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
  };
  useEffect(() => () => { stopWatch(); stopTicker(); }, []);

  const beginSegment = async () => {
    segStartRef.current = Date.now();
    stopTicker();
    ticker.current = setInterval(() => {
      setElapsed(accumRef.current + (Date.now() - segStartRef.current) / 1000);
    }, 1000);
    sub.current = await watchPosition((p) =>
      setPoints((prev) => {
        const tagged: GeoPoint = { ...p, seg: segRef.current };
        const last = prev[prev.length - 1];
        // Ignore sub-3m jitter within the same segment so standing still doesn't add distance.
        if (last && last.seg === tagged.seg && haversine(last, tagged) < 3) return prev;
        return [...prev, tagged];
      }),
    );
  };

  const start = async () => {
    if (!locationAvailable()) {
      setPerm('unavailable');
      return;
    }
    const res = await ensurePermission();
    if (res !== 'granted') {
      setPerm(res === 'denied' ? 'denied' : 'unavailable');
      return;
    }
    setPerm('unknown');
    setDiscarded(false);
    setPoints([]);
    setElapsed(0);
    accumRef.current = 0;
    segRef.current = 0;
    setStatus('tracking');
    await beginSegment();
  };

  const pause = () => {
    accumRef.current += (Date.now() - segStartRef.current) / 1000;
    stopWatch();
    stopTicker();
    setStatus('paused');
  };

  const resume = async () => {
    segRef.current += 1; // new segment, the gap won't be counted as distance
    setStatus('tracking');
    await beginSegment();
  };

  const finish = () => {
    if (status === 'tracking') accumRef.current += (Date.now() - segStartRef.current) / 1000;
    stopWatch();
    stopTicker();
    const secs = Math.round(accumRef.current);
    const km = routeDistanceKm(points);
    // Don't persist a junk session (no GPS fix, or barely moved).
    if (points.length < 2 || km < 0.05) {
      setDiscarded(true);
      reset();
      return;
    }
    setElapsed(secs);
    setStatus('done');
    const minutes = Math.max(1, Math.round(secs / 60));
    const kcal = metCalories(sport.met, minutes, body.weightKg);
    addSession({ kind: 'sport', sportKey: sport.key, minutes, distanceKm: +km.toFixed(2), kcal });
  };

  const reset = () => {
    setStatus('idle');
    setPoints([]);
    setElapsed(0);
    accumRef.current = 0;
    segRef.current = 0;
  };

  const km = routeDistanceKm(points);
  const avgPace = paceSecPerKm(km, elapsed);
  const curPace = recentPaceSecPerKm(points);
  const kmh = speedKmh(km, elapsed);
  const gain = elevationGainM(points);
  const kcal = metCalories(sport.met, Math.max(0, elapsed / 60), body.weightKg);
  const active = status === 'tracking' || status === 'paused';

  return (
    <Screen scroll={!active}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status === 'tracking' ? 'Pause' : 'Back'}
          hitSlop={8}
          onPress={() => (status === 'tracking' ? pause() : router.back())}
          style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">{status === 'done' ? 'Workout saved' : 'Track outdoors'}</AppText>
      </View>

      {status === 'idle' && (
        <SegmentedControl
          value={sportKey}
          onChange={setSportKey}
          options={GPS_SPORTS.map((s) => ({ value: s.key, label: s.name, icon: SPORT_ICON[s.key] }))}
        />
      )}

      {/* permission / availability notices */}
      {perm === 'unavailable' && (
        <View style={{ backgroundColor: colors.navBg, borderRadius: radii.lg, padding: spacing.md, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Icon name="map-pin" size={16} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>Live GPS needs a full device build, so it won’t track in this preview.</AppText>
        </View>
      )}
      {perm === 'denied' && (
        <View style={{ backgroundColor: tiles.peach.bg, borderRadius: radii.lg, padding: spacing.md, gap: 8 }}>
          <AppText variant="caption" color={tiles.peach.ink}>Location permission is off, so Nabdh can’t record your route. Turn it on to track distance and pace.</AppText>
          <Pressable onPress={() => Linking.openSettings()}>
            <AppText variant="caption" color={colors.accentText}>Open settings ›</AppText>
          </Pressable>
        </View>
      )}

      {/* route trace */}
      <Card style={{ height: 230, overflow: 'hidden', padding: 0, gap: 0, alignItems: 'center', justifyContent: 'center' }}>
        <RouteTrace pts={points} width={300} height={230} />
      </Card>

      {/* primary metric, distance */}
      <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
        <AppText variant="metric" style={{ fontSize: 64, lineHeight: 66 }} color={colors.accent}>{displayDistance(km, units).value}</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>{distanceUnit(units)}</AppText>
      </View>

      {/* secondary metrics */}
      <Card style={{ flexDirection: 'row', padding: 0, paddingVertical: spacing.lg, gap: 0 }}>
        <Metric value={fmtClock(elapsed)} label="TIME" />
        {isRide ? (
          <Metric value={kmh ? displaySpeed(kmh, units) : '-'} label={speedUnit(units)} />
        ) : (
          <Metric value={displayPace(status === 'tracking' ? (curPace || avgPace) : avgPace, units).value} label={`PACE ${displayPace(avgPace, units).unit}`} />
        )}
        <Metric value={String(kcal)} label="KCAL" />
      </Card>
      {status !== 'idle' && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xl }}>
          <AppText variant="caption" color={colors.textMuted}>Avg pace {displayPace(avgPace, units).value}{displayPace(avgPace, units).unit}</AppText>
          <AppText variant="caption" color={colors.textMuted}>Elev +{gain} m</AppText>
        </View>
      )}

      {/* controls */}
      {status === 'idle' && discarded && (
        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
          That session was too short to save, nothing was recorded.
        </AppText>
      )}
      {status === 'idle' && <Button label="Start" onPress={start} />}
      {status === 'tracking' && <Button label="Pause" variant="dark" onPress={pause} />}
      {status === 'paused' && (
        <View style={{ gap: spacing.sm }}>
          <Button label="Resume" onPress={resume} />
          <Button label="Finish" variant="line" onPress={finish} />
        </View>
      )}
      {status === 'done' && (
        <View style={{ gap: spacing.sm }}>
          <View style={{ backgroundColor: tiles.mint.bg, borderRadius: radii.lg, padding: spacing.lg }}>
            <AppText variant="title" color={tiles.mint.ink}>{displayDistance(km, units).value} {displayDistance(km, units).unit} · {fmtClock(elapsed)} · {kcal} kcal</AppText>
            <AppText variant="caption" color={tiles.mint.ink} style={{ marginTop: 2 }}>Saved to your history.</AppText>
          </View>
          <Button label="Done" onPress={() => router.back()} />
          <Button label="Track another" variant="line" onPress={reset} />
        </View>
      )}
    </Screen>
  );
}
