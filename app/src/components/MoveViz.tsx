import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../design-system/theme';

/**
 * MoveViz — a small looping "kinetic glyph" that animates the actual movement of an
 * exercise/sport (a runner's stride, a press extending, …) so the Workout screen feels
 * alive and the selected movement is unmistakable. Pure motion: no data, decorative.
 *
 * Built on a single 0→1 `phase` shared value driven by withRepeat, with each figure's
 * parts deriving their transforms from it in worklets (cheap, runs on the UI thread).
 * One `kind` per movement; anything not yet drawn falls back to a calm pulse so every
 * exercise still shows something. Respects the app palette via the theme.
 */
export type MoveKind = 'running' | string;

const DURATION: Record<string, number> = {
  running: 760, // a full stride cycle
};

export function MoveViz({ kind, size = 116, color, tint }: { kind: MoveKind; size?: number; color?: string; tint?: string }) {
  const { colors } = useTheme();
  const fg = color ?? colors.accent;
  const bg = tint ?? colors.navBg;
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = 0;
    phase.value = withRepeat(withTiming(1, { duration: DURATION[kind] ?? 1100, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(phase);
  }, [kind, phase]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {kind === 'running' ? <Runner phase={phase} size={size} fg={fg} bg={bg} /> : <Pulse phase={phase} size={size} fg={fg} bg={bg} />}
    </View>
  );
}

// --- Running: a side-view stride with swinging legs/arms and a 2-per-stride bob -------
function Runner({ phase, size, fg, bg }: { phase: SharedValue<number>; size: number; fg: string; bg: string }) {
  const s = size / 116; // everything below is authored at a 116px box, then scaled

  // leg/arm rotations: front and back swing in anti-phase; arms oppose the legs
  const legFront = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ rotate: `${Math.sin(phase.value * 2 * Math.PI) * 32}deg` }] };
  });
  const legBack = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ rotate: `${-Math.sin(phase.value * 2 * Math.PI) * 32}deg` }] };
  });
  const armFront = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ rotate: `${-Math.sin(phase.value * 2 * Math.PI) * 26}deg` }] };
  });
  const armBack = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ rotate: `${Math.sin(phase.value * 2 * Math.PI) * 26}deg` }] };
  });
  const bob = useAnimatedStyle(() => {
    'worklet';
    // hips rise twice per stride (once per footstrike)
    return { transform: [{ translateY: -Math.abs(Math.sin(phase.value * 2 * Math.PI)) * 3 * s }] };
  });

  const seg = (w: number, h: number, extra?: ViewStyle): ViewStyle => ({
    position: 'absolute',
    width: w * s,
    height: h * s,
    borderRadius: 99,
    backgroundColor: fg,
    ...extra,
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* ground */}
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.14, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />

      {/* hips group (bobs) — legs hang from here */}
      <Animated.View style={[{ position: 'absolute', left: size * 0.42, top: size * 0.5 }, bob]}>
        <Animated.View style={[seg(7, 36, { left: 0, top: 0 }), { transformOrigin: 'top center' }, legBack]} />
        <Animated.View style={[seg(7, 36, { left: 6 * s, top: 0 }), { transformOrigin: 'top center' }, legFront]} />
      </Animated.View>

      {/* shoulders group (bobs with hips) — torso, head, arms */}
      <Animated.View style={[{ position: 'absolute', left: size * 0.43, top: size * 0.2 }, bob]}>
        {/* torso, leaning slightly forward */}
        <View style={[seg(9, 34, { left: 2 * s, top: 6 * s }), { transform: [{ rotate: '10deg' }] }]} />
        {/* head */}
        <View style={{ position: 'absolute', left: 5 * s, top: -14 * s, width: 18 * s, height: 18 * s, borderRadius: 99, backgroundColor: fg }} />
        {/* arms from the shoulder */}
        <Animated.View style={[seg(6, 26, { left: 3 * s, top: 4 * s }), { transformOrigin: 'top center' }, armBack]} />
        <Animated.View style={[seg(6, 26, { left: 8 * s, top: 4 * s }), { transformOrigin: 'top center' }, armFront]} />
      </Animated.View>
    </View>
  );
}

// --- Fallback: a calm pulsing ring for movements without a bespoke animation yet -------
function Pulse({ phase, size, fg, bg }: { phase: SharedValue<number>; size: number; fg: string; bg: string }) {
  const ring = useAnimatedStyle(() => {
    'worklet';
    const p = Math.abs(Math.sin(phase.value * Math.PI));
    return { transform: [{ scale: 0.7 + p * 0.3 }], opacity: 0.35 + p * 0.45 };
  });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size * 0.5, height: size * 0.5, borderRadius: 999, borderWidth: 4, borderColor: fg }, ring]} />
      <View style={{ position: 'absolute', width: size * 0.12, height: size * 0.12, borderRadius: 999, backgroundColor: bg }} />
    </View>
  );
}
