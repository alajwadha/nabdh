import { useEffect, type ReactNode } from 'react';
import { AppState, View, Text } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
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
 * Foundation conventions (so all movements share one robust, battery-aware base):
 *  • One 0→1 `phase` shared value drives every part via UI-thread worklets.
 *  • Limbs rotate around a JOINT, not their own centre — done with a 0×0 pivot wrapper
 *    (`Limb`) rather than `transformOrigin`, which has cross-platform quirks.
 *  • The loop PAUSES when the app backgrounds, and honours the OS "reduce motion"
 *    setting (renders a static mid-pose instead of looping). The Sports card unmounts
 *    on tab switch, so off-screen costs nothing.
 *  • CONVENTION: every movement is a SIDE-VIEW profile (facing right), authored in a
 *    116px box and scaled by `size/116`, so the library stays visually consistent.
 * Anything without a bespoke figure falls back to the sport's own emoji gently pulsing
 * — clearly "this sport, motion coming" rather than an anonymous ring.
 */
export type MoveKind = 'running' | string;

const DURATION: Record<string, number> = {
  running: 760, // a full stride cycle
  legpress: 1500, // a controlled press out-and-back
};
const STATIC_PHASE = 0.25; // mid-movement pose used when motion is reduced

export function MoveViz({ kind, emoji, size = 116, color, tint }: { kind: MoveKind; emoji?: string; size?: number; color?: string; tint?: string }) {
  const { colors } = useTheme();
  const fg = color ?? colors.accent;
  const bg = tint ?? colors.navBg;
  const reduced = useReducedMotion();
  const phase = useSharedValue(0);

  useEffect(() => {
    const duration = DURATION[kind] ?? 1100;
    if (reduced) {
      phase.value = STATIC_PHASE; // no perpetual motion for users who opted out
      return;
    }
    const start = () => {
      phase.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    };
    start();
    // Don't burn frames while backgrounded.
    const sub = AppState.addEventListener('change', (s) => (s === 'active' ? start() : cancelAnimation(phase)));
    return () => {
      cancelAnimation(phase);
      sub.remove();
    };
  }, [kind, reduced, phase]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {kind === 'running' ? (
        <Runner phase={phase} size={size} fg={fg} bg={bg} />
      ) : kind === 'legpress' ? (
        <LegPress phase={phase} size={size} fg={fg} bg={bg} />
      ) : (
        <EmojiPulse phase={phase} size={size} emoji={emoji ?? '🏅'} />
      )}
    </View>
  );
}

/**
 * A limb that rotates around a joint. The outer 0×0 view sits AT the joint and rotates
 * about its own centre (== the joint); the inner bar hangs from it, centred horizontally.
 * No `transformOrigin` needed, so it behaves identically on iOS and Android.
 */
function Limb({ x, y, w, h, color, rot }: { x: number; y: number; w: number; h: number; color: string; rot: ReturnType<typeof useAnimatedStyle> }) {
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, width: 0, height: 0 }, rot]}>
      <View style={{ position: 'absolute', left: -w / 2, top: 0, width: w, height: h, borderRadius: 99, backgroundColor: color }} />
    </Animated.View>
  );
}

// --- Running: a side-view stride with swinging legs/arms and a 2-per-stride bob -------
function Runner({ phase, size, fg, bg }: { phase: SharedValue<number>; size: number; fg: string; bg: string }) {
  const s = size / 116;
  const legFront = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin(phase.value * 2 * Math.PI) * 32}deg` }] }));
  const legBack = useAnimatedStyle(() => ({ transform: [{ rotate: `${-Math.sin(phase.value * 2 * Math.PI) * 32}deg` }] }));
  const armFront = useAnimatedStyle(() => ({ transform: [{ rotate: `${-Math.sin(phase.value * 2 * Math.PI) * 26}deg` }] }));
  const armBack = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin(phase.value * 2 * Math.PI) * 26}deg` }] }));
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: -Math.abs(Math.sin(phase.value * 2 * Math.PI)) * 3 * s }] }));

  const hipX = size * 0.46;
  const hipY = size * 0.52;
  const shoX = size * 0.47;
  const shoY = size * 0.27;

  return (
    <View style={{ width: size, height: size }}>
      {/* ground */}
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.14, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />

      {/* legs hang from the hips and bob */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, bob]}>
        <Limb x={hipX} y={hipY} w={7 * s} h={36 * s} color={fg} rot={legBack} />
        <Limb x={hipX + 5 * s} y={hipY} w={7 * s} h={36 * s} color={fg} rot={legFront} />
      </Animated.View>

      {/* torso, head and swinging arms — also bob */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, bob]}>
        {/* torso connects shoulder→hip with a slight forward lean */}
        <View style={{ position: 'absolute', left: shoX - 1 * s, top: shoY, width: 9 * s, height: (hipY - shoY) + 6 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '8deg' }] }} />
        {/* head */}
        <View style={{ position: 'absolute', left: shoX + 2 * s, top: shoY - 18 * s, width: 18 * s, height: 18 * s, borderRadius: 99, backgroundColor: fg }} />
        {/* arms from the shoulder */}
        <Limb x={shoX + 3 * s} y={shoY + 2 * s} w={6 * s} h={26 * s} color={fg} rot={armBack} />
        <Limb x={shoX + 7 * s} y={shoY + 2 * s} w={6 * s} h={26 * s} color={fg} rot={armFront} />
      </Animated.View>
    </View>
  );
}

/**
 * A "bone" that extends RIGHT from a joint pivot and can nest another bone at its far
 * end (the 0×0 wrapper rotates about its centre = the joint; the bar hangs to the right;
 * children sit at the bar's end). Horizontal authoring makes joint angles intuitive
 * (0° = right, negative = up) and needs no transformOrigin. Reused for any jointed limb.
 */
function Bone({ x, y, len, w, color, rot, children }: {
  x: number; y: number; len: number; w: number; color: string;
  // animated style (worklet) for moving joints, or a plain transform for static ones
  rot: ReturnType<typeof useAnimatedStyle> | { transform: { rotate: string }[] }; children?: ReactNode;
}) {
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, width: 0, height: 0 }, rot]}>
      <View style={{ position: 'absolute', left: 0, top: -w / 2, width: len, height: w, borderRadius: 99, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: len, top: 0, width: 0, height: 0 }}>{children}</View>
    </Animated.View>
  );
}

// --- Leg press: a reclined figure whose jointed leg extends to press a footplate & back
function LegPress({ phase, size, fg, bg }: { phase: SharedValue<number>; size: number; fg: string; bg: string }) {
  const s = size / 116;
  // e: 0 = knee bent (foot near), 1 = leg extended (foot pressed away)
  const thigh = useAnimatedStyle(() => {
    'worklet';
    const e = (1 - Math.cos(phase.value * 2 * Math.PI)) / 2;
    return { transform: [{ rotate: `${-20 + e * 14}deg` }] };
  });
  const shin = useAnimatedStyle(() => {
    'worklet';
    const e = (1 - Math.cos(phase.value * 2 * Math.PI)) / 2;
    return { transform: [{ rotate: `${16 - e * 14}deg` }] };
  });
  const torso = { transform: [{ rotate: '-12deg' }] }; // static — no worklet needed
  return (
    <View style={{ width: size, height: size }}>
      {/* ground */}
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.14, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* head */}
      <View style={{ position: 'absolute', left: 14 * s, top: 40 * s, width: 18 * s, height: 18 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* reclined back */}
      <Bone x={18 * s} y={62 * s} len={34 * s} w={9 * s} color={fg} rot={torso} />
      {/* jointed leg: thigh → shin → footplate */}
      <Bone x={46 * s} y={62 * s} len={24 * s} w={9 * s} color={fg} rot={thigh}>
        <Bone x={0} y={0} len={24 * s} w={9 * s} color={fg} rot={shin}>
          {/* footplate — wider so it reads as the machine's platform, not a stick */}
          <View style={{ position: 'absolute', left: -2 * s, top: -18 * s, width: 11 * s, height: 36 * s, borderRadius: 5 * s, backgroundColor: fg }} />
        </Bone>
      </Bone>
    </View>
  );
}

// --- Fallback: the sport's own emoji, gently pulsing (clearly "this sport") -----------
function EmojiPulse({ phase, size, emoji }: { phase: SharedValue<number>; size: number; emoji: string }) {
  const pulse = useAnimatedStyle(() => {
    const p = Math.abs(Math.sin(phase.value * Math.PI));
    return { transform: [{ scale: 0.9 + p * 0.16 }], opacity: 0.7 + p * 0.3 };
  });
  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, pulse]}>
      <Text style={{ fontSize: size * 0.42 }}>{emoji}</Text>
    </Animated.View>
  );
}
