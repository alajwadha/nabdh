import { useEffect, type ReactNode } from 'react';
import { AppState, View, Text } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useDerivedValue,
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
  squat: 1700, // down and up under the bar
  bench: 1400, // press up and lower to the chest
  deadlift: 1700, // pull from the floor to lockout and back
  ohp: 1400, // press from the shoulders to overhead
  rowing: 1900, // drive, swing and pull, then recover
  cycling: 900, // one pedal revolution
  pullup: 1500, // pull up to the bar and lower
  dbcurl: 1300, // curl up and lower
  latpull: 1500, // pull the bar down and let it rise
  triext: 1200, // extend down and let it rise
  hipthrust: 1500, // drive the hips up to lockout and lower
  calfraise: 1300, // rise onto the toes and lower the heel below the step
  plank: 2200, // a slow forearm-plank hold with a gentle breathing lift
  padel: 1150, // a forehand swing, low-back to high-front
  tennis: 1150,
  jumprope: 620, // one rope revolution = one hop
};
const STATIC_PHASE = 0.25; // mid-movement pose used when motion is reduced

export function MoveViz({ kind, emoji, size = 116, color, tint }: { kind: MoveKind; emoji?: string; size?: number; color?: string; tint?: string }) {
  const { colors } = useTheme();
  const fg = color ?? colors.accent;
  const bg = tint ?? colors.navBg;
  // Equipment (bench, erg, bike frame) needs a mid-tone — `bg` matches the banner and
  // would be invisible; `fg` is too heavy. textMuted reads as "apparatus" against navBg.
  const equip = colors.textMuted;
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
      ) : kind === 'squat' ? (
        <Squat phase={phase} size={size} fg={fg} bg={bg} />
      ) : kind === 'bench' ? (
        <Bench phase={phase} size={size} fg={fg} bg={bg} equip={equip} />
      ) : kind === 'deadlift' ? (
        <Deadlift phase={phase} size={size} fg={fg} bg={bg} />
      ) : kind === 'ohp' ? (
        <Ohp phase={phase} size={size} fg={fg} bg={bg} />
      ) : kind === 'rowing' || kind === 'seatedrow' ? (
        <Rowing phase={phase} size={size} fg={fg} bg={bg} equip={equip} />
      ) : kind === 'cycling' ? (
        <Cycling phase={phase} size={size} fg={fg} bg={bg} equip={equip} />
      ) : kind === 'pullup' ? (
        <Pullup phase={phase} size={size} fg={fg} equip={equip} />
      ) : kind === 'dbcurl' ? (
        <Curl phase={phase} size={size} fg={fg} bg={bg} />
      ) : kind === 'latpull' ? (
        <LatPulldown phase={phase} size={size} fg={fg} equip={equip} />
      ) : kind === 'triext' ? (
        <Pushdown phase={phase} size={size} fg={fg} bg={bg} equip={equip} />
      ) : kind === 'hipthrust' ? (
        <HipThrust phase={phase} size={size} fg={fg} bg={bg} equip={equip} />
      ) : kind === 'calfraise' ? (
        <CalfRaise phase={phase} size={size} fg={fg} bg={bg} equip={equip} />
      ) : kind === 'plank' ? (
        <Plank phase={phase} size={size} fg={fg} bg={bg} />
      ) : kind === 'padel' || kind === 'tennis' ? (
        <RacketSwing phase={phase} size={size} fg={fg} bg={bg} equip={equip} />
      ) : kind === 'jumprope' ? (
        <JumpRope phase={phase} size={size} fg={fg} bg={bg} equip={equip} />
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

// --- Squat: a side figure with a barbell on the back, bending deep and standing up ----
function Squat({ phase, size, fg, bg }: { phase: SharedValue<number>; size: number; fg: string; bg: string }) {
  const s = size / 116;
  const depth = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 standing → 1 deep
  const thigh = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${75 - depth(phase.value) * 51}deg` }] }; });
  const shin = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-5 + depth(phase.value) * 71}deg` }] }; });
  const torso = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-100 - depth(phase.value) * 18}deg` }] }; });
  // body lowers as the knee folds, so the foot stays ~planted on the ground
  const body = useAnimatedStyle(() => { 'worklet'; return { transform: [{ translateY: depth(phase.value) * 14 * s }] }; });
  // head + barbell follow the SHOULDER as the torso leans (so they don't float off the spine)
  const headBar = useAnimatedStyle(() => {
    'worklet';
    const d = depth(phase.value);
    const a0 = -100 * Math.PI / 180;
    const a = (-100 - d * 18) * Math.PI / 180;
    const L = 30 * s;
    return { transform: [{ translateX: L * (Math.cos(a) - Math.cos(a0)) }, { translateY: L * (Math.sin(a) - Math.sin(a0)) }] };
  });

  const hipX = 52 * s;
  const hipY = 50 * s;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.12, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, body]}>
        {/* jointed leg from the hip: thigh → shin → foot */}
        <Bone x={hipX} y={hipY} len={23 * s} w={11 * s} color={fg} rot={thigh}>
          <Bone x={0} y={0} len={23 * s} w={11 * s} color={fg} rot={shin}>
            <View style={{ position: 'absolute', left: -4 * s, top: -4 * s, width: 16 * s, height: 8 * s, borderRadius: 4 * s, backgroundColor: fg }} />
          </Bone>
        </Bone>
        {/* torso up from the hip */}
        <Bone x={hipX} y={hipY} len={30 * s} w={10 * s} color={fg} rot={torso} />
        {/* head + barbell across the shoulders — translate to follow the leaning shoulder */}
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, headBar]}>
          <View style={{ position: 'absolute', left: 34 * s, top: 12 * s, width: 17 * s, height: 17 * s, borderRadius: 99, backgroundColor: fg }} />
          <View style={{ position: 'absolute', left: 22 * s, top: 22 * s, width: 44 * s, height: 6 * s, borderRadius: 99, backgroundColor: fg }} />
          <View style={{ position: 'absolute', left: 20 * s, top: 16 * s, width: 8 * s, height: 18 * s, borderRadius: 3 * s, backgroundColor: fg }} />
          <View style={{ position: 'absolute', left: 60 * s, top: 16 * s, width: 8 * s, height: 18 * s, borderRadius: 3 * s, backgroundColor: fg }} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// --- Bench press: a lying figure pressing a barbell up and lowering it to the chest ---
function Bench({ phase, size, fg, bg, equip }: { phase: SharedValue<number>; size: number; fg: string; bg: string; equip: string }) {
  const s = size / 116;
  const press = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 chest → 1 locked out
  const uarm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-60 - press(phase.value) * 20}deg` }] }; });
  const farm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-40 + press(phase.value) * 36}deg` }] }; });
  // Convention: a "stays-horizontal" object on rotating bones must counter-rotate by the
  // negated cumulative bone angle. Bar world-angle = uarm+farm = −100 + p·16, so cancel it.
  const bar = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${100 - press(phase.value) * 16}deg` }] }; });
  const stat = (deg: number) => ({ transform: [{ rotate: `${deg}deg` }] });
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.1, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* bench: platform + legs */}
      <View style={{ position: 'absolute', left: 22 * s, top: 81 * s, width: 6 * s, height: 18 * s, borderRadius: 99, backgroundColor: equip }} />
      <View style={{ position: 'absolute', left: 72 * s, top: 81 * s, width: 6 * s, height: 18 * s, borderRadius: 99, backgroundColor: equip }} />
      <View style={{ position: 'absolute', left: 16 * s, top: 74 * s, width: 66 * s, height: 7 * s, borderRadius: 99, backgroundColor: equip }} />
      {/* lying lifter */}
      <View style={{ position: 'absolute', left: 12 * s, top: 58 * s, width: 16 * s, height: 16 * s, borderRadius: 99, backgroundColor: fg }} />
      <View style={{ position: 'absolute', left: 26 * s, top: 66 * s, width: 38 * s, height: 10 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* bent legs off the end of the bench (static) */}
      <Bone x={62 * s} y={68 * s} len={18 * s} w={9 * s} color={fg} rot={stat(46)}>
        <Bone x={0} y={0} len={18 * s} w={9 * s} color={fg} rot={stat(58)} />
      </Bone>
      {/* pressing arm: upper arm → forearm → barbell */}
      <Bone x={36 * s} y={64 * s} len={17 * s} w={9 * s} color={fg} rot={uarm}>
        <Bone x={0} y={0} len={16 * s} w={9 * s} color={fg} rot={farm}>
          {/* barbell counter-rotates to stay level in world space through the press */}
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }, bar]}>
            <View style={{ position: 'absolute', left: -15 * s, top: -3 * s, width: 42 * s, height: 6 * s, borderRadius: 99, backgroundColor: fg }} />
            <View style={{ position: 'absolute', left: -19 * s, top: -9 * s, width: 8 * s, height: 18 * s, borderRadius: 3 * s, backgroundColor: fg }} />
            <View style={{ position: 'absolute', left: 19 * s, top: -9 * s, width: 8 * s, height: 18 * s, borderRadius: 3 * s, backgroundColor: fg }} />
          </Animated.View>
        </Bone>
      </Bone>
    </View>
  );
}

// --- Deadlift: a hip-hinge from the floor to lockout; straight arms, the bar stays level
function Deadlift({ phase, size, fg, bg }: { phase: SharedValue<number>; size: number; fg: string; bg: string }) {
  const s = size / 116;
  const lift = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 floor → 1 lockout
  const A0 = -44, A1 = -90; // torso hinge: bent-over → upright
  const torso = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${A0 + lift(phase.value) * (A1 - A0)}deg` }] }; });
  // head + straight arms + level bar are authored at the bottom pose and translate to
  // follow the shoulder as the torso stands up (so arms hang straight, bar stays level).
  const upper = useAnimatedStyle(() => {
    'worklet';
    const l = lift(phase.value);
    const a0 = (A0 * Math.PI) / 180;
    const a = ((A0 + l * (A1 - A0)) * Math.PI) / 180;
    const L = 27 * s;
    return { transform: [{ translateX: L * (Math.cos(a) - Math.cos(a0)) }, { translateY: L * (Math.sin(a) - Math.sin(a0)) }] };
  });
  // legs straighten slightly as the bar rises — subtle, so the lower body isn't frozen
  const thighL = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${74 + lift(phase.value) * 8}deg` }] }; });
  const shinL = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${10 - lift(phase.value) * 8}deg` }] }; });
  const hipX = 48 * s, hipY = 54 * s;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.1, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* legs extend a touch with the pull (knees pass under the bar) */}
      <Bone x={hipX} y={hipY} len={21 * s} w={11 * s} color={fg} rot={thighL}>
        <Bone x={0} y={0} len={21 * s} w={11 * s} color={fg} rot={shinL} />
      </Bone>
      {/* torso hinge from the hip */}
      <Bone x={hipX} y={hipY} len={27 * s} w={11 * s} color={fg} rot={torso} />
      {/* upper body: head + straight arm + level bar, following the shoulder */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, upper]}>
        <View style={{ position: 'absolute', left: 69 * s, top: 20 * s, width: 16 * s, height: 16 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 69 * s, top: 36 * s, width: 9 * s, height: 24 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 58 * s, top: 58 * s, width: 34 * s, height: 6 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 55 * s, top: 50 * s, width: 19 * s, height: 19 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 76 * s, top: 50 * s, width: 19 * s, height: 19 * s, borderRadius: 99, backgroundColor: fg }} />
      </Animated.View>
    </View>
  );
}

// --- Overhead press: standing figure presses a bar from the shoulders to overhead ----
function Ohp({ phase, size, fg, bg }: { phase: SharedValue<number>; size: number; fg: string; bg: string }) {
  const s = size / 116;
  const press = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 shoulders → 1 overhead
  // deeper rack at the bottom (bar at the front of the shoulders = the OHP-identifying frame)
  const uarm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-72 - press(phase.value) * 12}deg` }] }; });
  const farm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-50 + press(phase.value) * 44}deg` }] }; });
  const bar = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${122 - press(phase.value) * 32}deg` }] }; }); // = −(uarm+farm), keeps bar level
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.08, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* standing figure (nudged down so the overhead bar has headroom): legs, torso, head */}
      <View style={{ position: 'absolute', left: 54 * s, top: 79 * s, width: 9 * s, height: 24 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '5deg' }] }} />
      <View style={{ position: 'absolute', left: 49 * s, top: 79 * s, width: 9 * s, height: 24 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '-5deg' }] }} />
      <View style={{ position: 'absolute', left: 49 * s, top: 49 * s, width: 10 * s, height: 32 * s, borderRadius: 99, backgroundColor: fg }} />
      <View style={{ position: 'absolute', left: 40 * s, top: 33 * s, width: 17 * s, height: 17 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* pressing arm: upper arm → forearm → level bar */}
      <Bone x={54 * s} y={51 * s} len={18 * s} w={9 * s} color={fg} rot={uarm}>
        <Bone x={0} y={0} len={16 * s} w={9 * s} color={fg} rot={farm}>
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }, bar]}>
            <View style={{ position: 'absolute', left: -15 * s, top: -3 * s, width: 40 * s, height: 6 * s, borderRadius: 99, backgroundColor: fg }} />
            <View style={{ position: 'absolute', left: -19 * s, top: -9 * s, width: 8 * s, height: 18 * s, borderRadius: 3 * s, backgroundColor: fg }} />
            <View style={{ position: 'absolute', left: 17 * s, top: -9 * s, width: 8 * s, height: 18 * s, borderRadius: 3 * s, backgroundColor: fg }} />
          </Animated.View>
        </Bone>
      </Bone>
    </View>
  );
}

// Rowing stroke is SEQUENCED, not simultaneous: each joint extends during its own slice
// of the drive (first half of phase) and reverses during recovery. e: 0 catch → 1 finish.
function rowE(p: number, dS: number, dE: number, rS: number, rE: number): number {
  'worklet';
  const seg = (a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));
  return p < 0.5 ? seg(dS, dE) : 1 - seg(rS, rE);
}
// Forward-kinematics world position of the rowing handle (for the chain/cable line).
function rowHand(p: number, s: number): { x: number; y: number } {
  'worklet';
  const R = Math.PI / 180;
  const eT = rowE(p, 0.18, 0.42, 0.6, 0.82);
  const eA = rowE(p, 0.32, 0.5, 0.5, 0.68);
  const a0 = -124 * R, aT = (-100 - eT * 24) * R;
  const rootX = 30 * s + 30 * s * (Math.cos(aT) - Math.cos(a0));
  const rootY = 46 * s + 30 * s * (Math.sin(aT) - Math.sin(a0));
  const ua = (20 - eA * 28) * R;
  const ex = rootX + 14 * s * Math.cos(ua), ey = rootY + 14 * s * Math.sin(ua);
  const ha = ua + (-20 + eA * 54) * R;
  return { x: ex + 15 * s * Math.cos(ha), y: ey + 15 * s * Math.sin(ha) };
}

// --- Rowing (erg): legs drive, torso swings back, arms pull — sequenced like a real stroke
function Rowing({ phase, size, fg, bg, equip }: { phase: SharedValue<number>; size: number; fg: string; bg: string; equip: string }) {
  const s = size / 116;
  const thigh = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-20 + rowE(phase.value, 0, 0.3, 0.7, 1) * 22}deg` }] }; });
  const shin = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${36 - rowE(phase.value, 0, 0.3, 0.7, 1) * 40}deg` }] }; });
  const torso = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-100 - rowE(phase.value, 0.18, 0.42, 0.6, 0.82) * 24}deg` }] }; });
  const uarm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${20 - rowE(phase.value, 0.32, 0.5, 0.5, 0.68) * 28}deg` }] }; });
  const farm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-20 + rowE(phase.value, 0.32, 0.5, 0.5, 0.68) * 54}deg` }] }; });
  const upper = useAnimatedStyle(() => {
    'worklet';
    const R = Math.PI / 180;
    const a0 = -124 * R, a = (-100 - rowE(phase.value, 0.18, 0.42, 0.6, 0.82) * 24) * R;
    const L = 30 * s;
    return { transform: [{ translateX: L * (Math.cos(a) - Math.cos(a0)) }, { translateY: L * (Math.sin(a) - Math.sin(a0)) }] };
  });
  // chain/cable from the flywheel centre to the handle (pivot rotates, inner bar = distance)
  const flyX = 99 * s, flyY = 59 * s;
  const cableRot = useAnimatedStyle(() => { 'worklet'; const h = rowHand(phase.value, s); return { transform: [{ rotate: `${Math.atan2(h.y - flyY, h.x - flyX)}rad` }] }; });
  const cableLen = useAnimatedStyle(() => { 'worklet'; const h = rowHand(phase.value, s); return { width: Math.sqrt((h.x - flyX) ** 2 + (h.y - flyY) ** 2) }; });
  const hipX = 44 * s, hipY = 70 * s;
  return (
    <View style={{ width: size, height: size }}>
      {/* rail + flywheel + footplate + seat (static machine) */}
      <View style={{ position: 'absolute', left: size * 0.07, right: size * 0.07, bottom: size * 0.15, height: 4 * s, borderRadius: 99, backgroundColor: equip }} />
      <View style={{ position: 'absolute', left: 88 * s, top: 48 * s, width: 22 * s, height: 22 * s, borderRadius: 99, backgroundColor: equip }} />
      <View style={{ position: 'absolute', left: 84 * s, top: 62 * s, width: 6 * s, height: 18 * s, borderRadius: 99, backgroundColor: equip }} />
      <View style={{ position: 'absolute', left: 34 * s, top: 74 * s, width: 18 * s, height: 6 * s, borderRadius: 99, backgroundColor: equip }} />
      {/* chain/cable: a Bone-style pivot at the flywheel with an animated-length bar to the handle */}
      <Animated.View style={[{ position: 'absolute', left: flyX, top: flyY, width: 0, height: 0 }, cableRot]}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: -1.5 * s, height: 3 * s, borderRadius: 99, backgroundColor: equip }, cableLen]} />
      </Animated.View>
      {/* legs extend from bent (catch) to straight (finish) */}
      <Bone x={hipX} y={hipY} len={24 * s} w={9 * s} color={fg} rot={thigh}>
        <Bone x={0} y={0} len={20 * s} w={9 * s} color={fg} rot={shin} />
      </Bone>
      {/* torso swing from the hip */}
      <Bone x={hipX} y={hipY} len={30 * s} w={10 * s} color={fg} rot={torso} />
      {/* head + pulling arm, following the shoulder */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, upper]}>
        <View style={{ position: 'absolute', left: 20 * s, top: 30 * s, width: 16 * s, height: 16 * s, borderRadius: 99, backgroundColor: fg }} />
        <Bone x={30 * s} y={46 * s} len={14 * s} w={8 * s} color={fg} rot={uarm}>
          <Bone x={0} y={0} len={15 * s} w={8 * s} color={fg} rot={farm}>
            <View style={{ position: 'absolute', left: -2 * s, top: -8 * s, width: 6 * s, height: 16 * s, borderRadius: 99, backgroundColor: fg }} />
          </Bone>
        </Bone>
      </Animated.View>
    </View>
  );
}

// ATTACHMENT CONVENTIONS — how an object (bar, plate, cable, handle) stays put on a
// moving limb. Three cases cover every figure:
//   (1) object sits at the IK TARGET (the hand we solve toward) → attach DIRECTLY; its
//       position is a known input (lat-pulldown bar/cable, pull-up bar).
//   (2) object sits at an FK CHAIN END (position computed from joint angles), and is
//       rigid → TRANSLATE-FOLLOW the computed point (rowing handle/cable, squat headbar).
//   (3) object rides a BENDING limb and must stay level → COUNTER-ROTATE by the negated
//       cumulative bone angle (bench/OHP/curl bar & dumbbell).
//
// Two-bar inverse kinematics (limb-agnostic): place an end-effector (fx,fy) from a
// root (hx,hy) with segments L1,L2. Returns the root's world angle and the shin angle RELATIVE to the thigh
// (so they map straight onto nested Bones). `bend` (±1) picks which way the knee folds.
function solve2Bar(hx: number, hy: number, fx: number, fy: number, L1: number, L2: number, bend: number): { a: number; bRel: number } {
  'worklet';
  const dx = fx - hx, dy = fy - hy;
  let d = Math.sqrt(dx * dx + dy * dy);
  const base = Math.atan2(dy, dx);
  d = Math.min(d, L1 + L2 - 0.01); // clamp to reachable
  let c = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  c = Math.max(-1, Math.min(1, c));
  const A = Math.acos(c);
  const td = base + bend * A;
  const kx = hx + L1 * Math.cos(td), ky = hy + L1 * Math.sin(td);
  const sd = Math.atan2(fy - ky, fx - kx);
  return { a: (td * 180) / Math.PI, bRel: ((sd - td) * 180) / Math.PI };
}

// --- Cycling: a rider whose feet orbit the crank — legs solved by IK to follow the pedals
function Cycling({ phase, size, fg, bg, equip }: { phase: SharedValue<number>; size: number; fg: string; bg: string; equip: string }) {
  const s = size / 116;
  const cx = 58 * s, cy = 72 * s, r = 11 * s; // crank centre + radius
  const hx = 44 * s, hy = 48 * s, L1 = 22 * s, L2 = 22 * s; // hip on the saddle, leg lengths
  const stat = (deg: number) => ({ transform: [{ rotate: `${deg}deg` }] });
  // each leg's foot orbits the crank; solve the 2-bar IK ONCE per leg, consume in thigh+shin
  const ikA = useDerivedValue(() => { 'worklet'; const t = phase.value * 2 * Math.PI; return solve2Bar(hx, hy, cx + r * Math.cos(t), cy + r * Math.sin(t), L1, L2, -1); });
  const ikB = useDerivedValue(() => { 'worklet'; const t = phase.value * 2 * Math.PI + Math.PI; return solve2Bar(hx, hy, cx + r * Math.cos(t), cy + r * Math.sin(t), L1, L2, -1); });
  const thighA = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ikA.value.a}deg` }] }; });
  const shinA = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ikA.value.bRel}deg` }] }; });
  const thighB = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ikB.value.a}deg` }] }; });
  const shinB = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ikB.value.bRel}deg` }] }; });
  const foot = { position: 'absolute' as const, left: 18 * s, top: -2 * s, width: 11 * s, height: 6 * s, borderRadius: 3 * s, backgroundColor: fg };
  const wheel = (left: number) => ({ position: 'absolute' as const, left, top: 71 * s, width: 30 * s, height: 30 * s, borderRadius: 99, borderWidth: 4 * s, borderColor: equip });
  return (
    <View style={{ width: size, height: size }}>
      {/* far leg first + dimmed, so it reads as behind the bike */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, opacity: 0.55 }}>
        <Bone x={hx} y={hy} len={22 * s} w={8 * s} color={fg} rot={thighB}>
          <Bone x={0} y={0} len={22 * s} w={8 * s} color={fg} rot={shinB}><View style={foot} /></Bone>
        </Bone>
      </View>
      {/* bike: wheels, frame tubes, crank (mid-tone so it reads as apparatus) */}
      <View style={wheel(11 * s)} />
      <View style={wheel(75 * s)} />
      <Bone x={58 * s} y={72 * s} len={35 * s} w={4 * s} color={equip} rot={stat(156)} />
      <Bone x={58 * s} y={72 * s} len={28 * s} w={4 * s} color={equip} rot={stat(-120)} />
      <Bone x={58 * s} y={72 * s} len={34 * s} w={4 * s} color={equip} rot={stat(-50)} />
      <Bone x={80 * s} y={46 * s} len={41 * s} w={4 * s} color={equip} rot={stat(76)} />
      <Bone x={44 * s} y={48 * s} len={36 * s} w={4 * s} color={equip} rot={stat(-3)} />
      <View style={{ position: 'absolute', left: 55 * s, top: 69 * s, width: 7 * s, height: 7 * s, borderRadius: 99, backgroundColor: equip }} />
      {/* rider: torso leaning to the bars, head, arm */}
      <Bone x={44 * s} y={48 * s} len={22 * s} w={9 * s} color={fg} rot={stat(-34)} />
      <View style={{ position: 'absolute', left: 56 * s, top: 22 * s, width: 15 * s, height: 15 * s, borderRadius: 99, backgroundColor: fg }} />
      <Bone x={62 * s} y={35 * s} len={20 * s} w={7 * s} color={fg} rot={stat(40)} />
      {/* near leg */}
      <Bone x={hx} y={hy} len={22 * s} w={8 * s} color={fg} rot={thighA}>
        <Bone x={0} y={0} len={22 * s} w={8 * s} color={fg} rot={shinA}><View style={foot} /></Bone>
      </Bone>
    </View>
  );
}

// --- Pull-up: hands fixed on the bar, the body rises as the arms (IK) bend, then lowers
function Pullup({ phase, size, fg, equip }: { phase: SharedValue<number>; size: number; fg: string; equip: string }) {
  const s = size / 116;
  const stat = (deg: number) => ({ transform: [{ rotate: `${deg}deg` }] });
  // the whole body translates up by the pull; the arm IK targets the fixed bar in local
  // coords (which slides down relative to the rising body), so the hand stays on the bar.
  const body = useAnimatedStyle(() => { 'worklet'; const p = (1 - Math.cos(phase.value * 2 * Math.PI)) / 2; return { transform: [{ translateY: -16 * p * s }] }; });
  const ik = useDerivedValue(() => { 'worklet'; const p = (1 - Math.cos(phase.value * 2 * Math.PI)) / 2; return solve2Bar(58 * s, 52 * s, 58 * s, (24 + 16 * p) * s, 14 * s, 13 * s, 1); });
  const uarm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ik.value.a}deg` }] }; });
  const farm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ik.value.bRel}deg` }] }; });
  return (
    <View style={{ width: size, height: size }}>
      {/* fixed pull-up bar + supports */}
      <View style={{ position: 'absolute', left: 28 * s, top: 22 * s, width: 60 * s, height: 5 * s, borderRadius: 99, backgroundColor: equip }} />
      <View style={{ position: 'absolute', left: 28 * s, top: 22 * s, width: 5 * s, height: 16 * s, borderRadius: 99, backgroundColor: equip }} />
      <View style={{ position: 'absolute', left: 83 * s, top: 22 * s, width: 5 * s, height: 16 * s, borderRadius: 99, backgroundColor: equip }} />
      {/* body rises with the pull */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, body]}>
        <View style={{ position: 'absolute', left: 50 * s, top: 37 * s, width: 16 * s, height: 16 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 53 * s, top: 52 * s, width: 10 * s, height: 26 * s, borderRadius: 99, backgroundColor: fg }} />
        <Bone x={58 * s} y={78 * s} len={18 * s} w={9 * s} color={fg} rot={stat(82)}>
          <Bone x={0} y={0} len={18 * s} w={9 * s} color={fg} rot={stat(-14)} />
        </Bone>
        {/* arm: shoulder → IK → hand on the bar */}
        <Bone x={58 * s} y={52 * s} len={14 * s} w={8 * s} color={fg} rot={uarm}>
          <Bone x={0} y={0} len={13 * s} w={8 * s} color={fg} rot={farm}>
            <View style={{ position: 'absolute', left: 11 * s, top: -3 * s, width: 8 * s, height: 6 * s, borderRadius: 99, backgroundColor: fg }} />
          </Bone>
        </Bone>
      </Animated.View>
    </View>
  );
}

// --- Bicep curl: standing, upper arm fixed at the side, forearm curls a dumbbell up ---
function Curl({ phase, size, fg, bg }: { phase: SharedValue<number>; size: number; fg: string; bg: string }) {
  const s = size / 116;
  const c = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 extended (down) → 1 curled (up)
  const forearm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${90 - c(phase.value) * 130}deg` }] }; }); // world angle: down → up
  const bell = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-90 + c(phase.value) * 130}deg` }] }; }); // counter-rotate → dumbbell stays level
  const elbowX = 57 * s, elbowY = 58 * s;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.1, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* standing figure */}
      <View style={{ position: 'absolute', left: 54 * s, top: 66 * s, width: 9 * s, height: 28 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '5deg' }] }} />
      <View style={{ position: 'absolute', left: 49 * s, top: 66 * s, width: 9 * s, height: 28 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '-5deg' }] }} />
      <View style={{ position: 'absolute', left: 49 * s, top: 34 * s, width: 10 * s, height: 32 * s, borderRadius: 99, backgroundColor: fg }} />
      <View style={{ position: 'absolute', left: 44 * s, top: 16 * s, width: 17 * s, height: 17 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* upper arm fixed at the side (shoulder → elbow) */}
      <View style={{ position: 'absolute', left: 53 * s, top: 36 * s, width: 9 * s, height: 23 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* forearm curls around the elbow, dumbbell stays level */}
      <Bone x={elbowX} y={elbowY} len={18 * s} w={9 * s} color={fg} rot={forearm}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }, bell]}>
          <View style={{ position: 'absolute', left: -10 * s, top: -2.5 * s, width: 20 * s, height: 5 * s, borderRadius: 99, backgroundColor: fg }} />
          <View style={{ position: 'absolute', left: -13 * s, top: -6 * s, width: 7 * s, height: 13 * s, borderRadius: 2 * s, backgroundColor: fg }} />
          <View style={{ position: 'absolute', left: 6 * s, top: -6 * s, width: 7 * s, height: 13 * s, borderRadius: 2 * s, backgroundColor: fg }} />
        </Animated.View>
      </Bone>
    </View>
  );
}

// --- Lat pulldown: seated, pull the cable bar down to the chest; arm by IK, bar+cable
//     attach to the KNOWN hand target (no forward kinematics needed).
function LatPulldown({ phase, size, fg, equip }: { phase: SharedValue<number>; size: number; fg: string; equip: string }) {
  const s = size / 116;
  const stat = (deg: number) => ({ transform: [{ rotate: `${deg}deg` }] });
  // hand path: high-narrow (top) → chest (bottom). p: 0 top → 1 chest.
  const ik = useDerivedValue(() => { 'worklet'; const p = (1 - Math.cos(phase.value * 2 * Math.PI)) / 2; return solve2Bar(52 * s, 50 * s, (60 - p * 2) * s, (28 + p * 24) * s, 12 * s, 12 * s, 1); });
  const uarm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ik.value.a}deg` }] }; });
  const farm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ik.value.bRel}deg` }] }; });
  // bar + cable follow the same known hand target (bar stays level — not nested in the arm)
  const bar = useAnimatedStyle(() => { 'worklet'; const p = (1 - Math.cos(phase.value * 2 * Math.PI)) / 2; return { transform: [{ translateX: -p * 2 * s }, { translateY: p * 24 * s }] }; });
  const cable = useAnimatedStyle(() => { 'worklet'; const p = (1 - Math.cos(phase.value * 2 * Math.PI)) / 2; return { height: (14 + p * 24) * s }; });
  return (
    <View style={{ width: size, height: size }}>
      {/* machine: top pulley, seat, thigh pad */}
      <View style={{ position: 'absolute', left: 50 * s, top: 6 * s, width: 16 * s, height: 16 * s, borderRadius: 99, borderWidth: 4 * s, borderColor: equip }} />
      <View style={{ position: 'absolute', left: 34 * s, top: 78 * s, width: 22 * s, height: 6 * s, borderRadius: 99, backgroundColor: equip }} />
      <View style={{ position: 'absolute', left: 48 * s, top: 71 * s, width: 24 * s, height: 6 * s, borderRadius: 99, backgroundColor: equip }} />
      {/* cable from the pulley down to the bar (animated length) */}
      <Animated.View style={[{ position: 'absolute', left: 57 * s, top: 14 * s, width: 4 * s, borderRadius: 99, backgroundColor: equip }, cable]} />
      {/* seated rider */}
      <View style={{ position: 'absolute', left: 42 * s, top: 34 * s, width: 16 * s, height: 16 * s, borderRadius: 99, backgroundColor: fg }} />
      <View style={{ position: 'absolute', left: 48 * s, top: 50 * s, width: 10 * s, height: 26 * s, borderRadius: 99, backgroundColor: fg }} />
      <Bone x={46 * s} y={76 * s} len={22 * s} w={9 * s} color={fg} rot={stat(8)}>
        <Bone x={0} y={0} len={20 * s} w={9 * s} color={fg} rot={stat(72)} />
      </Bone>
      {/* pulling arm */}
      <Bone x={52 * s} y={50 * s} len={12 * s} w={8 * s} color={fg} rot={uarm}>
        <Bone x={0} y={0} len={12 * s} w={8 * s} color={fg} rot={farm} />
      </Bone>
      {/* the wide bar (authored at the top, translates down to the chest) */}
      <Animated.View style={[{ position: 'absolute', left: 42 * s, top: 26 * s, width: 34 * s, height: 5 * s, borderRadius: 99, backgroundColor: equip }, bar]} />
    </View>
  );
}

// Triceps-pushdown forearm tip (FK): forearm starts clearly bent (−45°) and extends to
// straight down (88°), so the read is an unmistakable bent→straight pushdown.
function triHand(p: number, s: number): { x: number; y: number } {
  'worklet';
  const th = ((-45 + p * 133) * Math.PI) / 180;
  return { x: 54 * s + 18 * s * Math.cos(th), y: 52 * s + 18 * s * Math.sin(th) };
}

// --- Triceps pushdown: standing at a cable, upper arm pinned, forearm extends down -----
function Pushdown({ phase, size, fg, bg, equip }: { phase: SharedValue<number>; size: number; fg: string; bg: string; equip: string }) {
  const s = size / 116;
  const p = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 bent (up) → 1 extended (down)
  const forearm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${-45 + p(phase.value) * 133}deg` }] }; });
  const bar = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${45 - p(phase.value) * 133}deg` }] }; }); // counter-rotate → bar level
  const flyX = 64 * s, flyY = 12 * s; // pulley centre
  const hand = useDerivedValue(() => { 'worklet'; return triHand(p(phase.value), s); }); // solve-once FK tip
  const cableRot = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${Math.atan2(hand.value.y - flyY, hand.value.x - flyX)}rad` }] }; });
  const cableLen = useAnimatedStyle(() => { 'worklet'; return { width: Math.sqrt((hand.value.x - flyX) ** 2 + (hand.value.y - flyY) ** 2) }; });
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.1, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* top pulley + cable to the bar */}
      <View style={{ position: 'absolute', left: 56 * s, top: 4 * s, width: 16 * s, height: 16 * s, borderRadius: 99, borderWidth: 4 * s, borderColor: equip }} />
      <Animated.View style={[{ position: 'absolute', left: flyX, top: flyY, width: 0, height: 0 }, cableRot]}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: -1.5 * s, height: 3 * s, borderRadius: 99, backgroundColor: equip }, cableLen]} />
      </Animated.View>
      {/* standing figure */}
      <View style={{ position: 'absolute', left: 54 * s, top: 62 * s, width: 9 * s, height: 28 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '5deg' }] }} />
      <View style={{ position: 'absolute', left: 49 * s, top: 62 * s, width: 9 * s, height: 28 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '-5deg' }] }} />
      <View style={{ position: 'absolute', left: 50 * s, top: 30 * s, width: 10 * s, height: 32 * s, borderRadius: 99, backgroundColor: fg }} />
      <View style={{ position: 'absolute', left: 46 * s, top: 14 * s, width: 16 * s, height: 16 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* upper arm pinned vertical at the side */}
      <View style={{ position: 'absolute', left: 53 * s, top: 32 * s, width: 9 * s, height: 21 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* forearm extends down; the bar (equip, machine) counter-rotates level at its end */}
      <Bone x={54 * s} y={52 * s} len={18 * s} w={8 * s} color={fg} rot={forearm}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }, bar]}>
          <View style={{ position: 'absolute', left: -10 * s, top: -2.5 * s, width: 20 * s, height: 5 * s, borderRadius: 99, backgroundColor: equip }} />
        </Animated.View>
      </Bone>
    </View>
  );
}

// --- Hip thrust: upper back pinned on a bench, barbell on the hips, drive to lockout ---
// The shoulder is fixed on the bench, the foot is planted; the HIP is the moving joint.
// Torso rotates about the shoulder, so its far end traces the hip (FK). The leg then
// solves by 2-bar IK from that moving hip down to the fixed foot (knee stays ~planted).
function HipThrust({ phase, size, fg, bg, equip }: { phase: SharedValue<number>; size: number; fg: string; bg: string; equip: string }) {
  const s = size / 116;
  const shx = 30 * s, shy = 56 * s, tL = 38 * s; // shoulder pivot on the bench + torso length
  const footX = 92 * s, footY = 80 * s, thighL = 21 * s, shinL = 21 * s; // planted foot + leg
  const A0 = 24, A1 = -7; // torso world angle: hips low (bottom) → near level (lockout)
  const p = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 bottom → 1 top
  // hip = far end of the torso bone (FK). Authored bottom-pose hip is the translate anchor.
  const hip0x = shx + tL * Math.cos((A0 * Math.PI) / 180), hip0y = shy + tL * Math.sin((A0 * Math.PI) / 180);
  const hip = useDerivedValue(() => { 'worklet'; const a = ((A0 + p(phase.value) * (A1 - A0)) * Math.PI) / 180; return { x: shx + tL * Math.cos(a), y: shy + tL * Math.sin(a) }; });
  // leg IK solved in WORLD coords; bone angles are translation-invariant, so they apply
  // unchanged inside the translate-follow group that carries the leg root to the hip.
  const ik = useDerivedValue(() => { 'worklet'; return solve2Bar(hip.value.x, hip.value.y, footX, footY, thighL, shinL, -1); });
  const torso = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${A0 + p(phase.value) * (A1 - A0)}deg` }] }; });
  const thigh = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ik.value.a}deg` }] }; });
  const shin = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ik.value.bRel}deg` }] }; });
  // leg + plate both ride the moving hip (translate by hip − hip0)
  const follow = useAnimatedStyle(() => { 'worklet'; return { transform: [{ translateX: hip.value.x - hip0x }, { translateY: hip.value.y - hip0y }] }; });
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.1, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* bench: pad the upper back rests on + a support leg */}
      <View style={{ position: 'absolute', left: 8 * s, top: 57 * s, width: 30 * s, height: 10 * s, borderRadius: 4 * s, backgroundColor: equip }} />
      <View style={{ position: 'absolute', left: 16 * s, top: 67 * s, width: 7 * s, height: 22 * s, borderRadius: 99, backgroundColor: equip }} />
      {/* head resting on the bench */}
      <View style={{ position: 'absolute', left: 11 * s, top: 40 * s, width: 17 * s, height: 17 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* torso pivots about the fixed shoulder; its end traces the hip */}
      <Bone x={shx} y={shy} len={tL} w={10 * s} color={fg} rot={torso} />
      {/* leg rides the hip: thigh (IK) → shin → planted foot */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, follow]}>
        <Bone x={hip0x} y={hip0y} len={thighL} w={9 * s} color={fg} rot={thigh}>
          <Bone x={0} y={0} len={shinL} w={9 * s} color={fg} rot={shin}>
            <View style={{ position: 'absolute', left: -3 * s, top: -3 * s, width: 14 * s, height: 7 * s, borderRadius: 3 * s, backgroundColor: fg }} />
          </Bone>
        </Bone>
        {/* loaded barbell on the hips — a shaft across the hips + the plate edge-on, so it
            reads as a loaded bar (not a body bulge), riding the same hip point */}
        <View style={{ position: 'absolute', left: hip0x - 19 * s, top: hip0y - 2.5 * s, width: 39 * s, height: 5 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: hip0x - 11.5 * s, top: hip0y - 11.5 * s, width: 23 * s, height: 23 * s, borderRadius: 99, backgroundColor: fg }} />
      </Animated.View>
    </View>
  );
}

// --- Calf raise: ball of foot fixed on a step edge; heel drops below then rises onto the
// toes while the whole body lifts. The body translates straight UP (clean, no lateral
// slide); the foot's instep "stretches" between the fixed ball and the rising ankle —
// foreshortened (flat foot) at the bottom, near-vertical (on toes) at the top.
function CalfRaise({ phase, size, fg, bg, equip }: { phase: SharedValue<number>; size: number; fg: string; bg: string; equip: string }) {
  const s = size / 116;
  const ballX = 58 * s, ballY = 84 * s; // ball of foot on the step edge (fixed pivot)
  const ankX = 54 * s, ankBotY = 80 * s, riseY = 12 * s; // ankle: bottom pose + how far it lifts
  const p = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 heel-dropped → 1 on toes
  // body (legs/torso/head/arms/heel) lifts straight up onto the toes
  const lift = useAnimatedStyle(() => { 'worklet'; return { transform: [{ translateY: -riseY * p(phase.value) }] }; });
  // instep bone connects the FIXED ball to the RISING ankle (animated angle + length)
  const ankle = useDerivedValue(() => { 'worklet'; return { x: ankX, y: ankBotY - riseY * p(phase.value) }; });
  const instepRot = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${Math.atan2(ankle.value.y - ballY, ankle.value.x - ballX)}rad` }] }; });
  const instepLen = useAnimatedStyle(() => { 'worklet'; return { width: Math.sqrt((ankle.value.x - ballX) ** 2 + (ankle.value.y - ballY) ** 2) }; });
  // heel: droops an extra bit below the step at the bottom (the deep stretch) and rises
  // above it on the toes — its own swing, deeper than the body lift alone.
  const heel = useAnimatedStyle(() => { 'worklet'; const q = p(phase.value); return { transform: [{ translateY: (4 - 16 * q) * s }, { rotate: `${20 - q * 30}deg` }] }; });
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.08, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* the step / block the toes press on */}
      <View style={{ position: 'absolute', left: 58 * s, top: 84 * s, width: 46 * s, height: 18 * s, borderRadius: 3 * s, backgroundColor: equip }} />
      {/* ball of foot on the step edge (the fixed pivot) */}
      <View style={{ position: 'absolute', left: 58 * s, top: 82 * s, width: 13 * s, height: 5 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* instep: fixed ball → rising ankle (Bone-style pivot with an animated-length bar) */}
      <Animated.View style={[{ position: 'absolute', left: ballX, top: ballY, width: 0, height: 0 }, instepRot]}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: -3 * s, height: 6 * s, borderRadius: 99, backgroundColor: fg }, instepLen]} />
      </Animated.View>
      {/* everything above the ankle lifts straight up onto the toes */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, lift]}>
        <View style={{ position: 'absolute', left: 49 * s, top: 58 * s, width: 8 * s, height: 22 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 54 * s, top: 58 * s, width: 8 * s, height: 22 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 49 * s, top: 34 * s, width: 10 * s, height: 25 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 46 * s, top: 36 * s, width: 7 * s, height: 23 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 60 * s, top: 36 * s, width: 7 * s, height: 23 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 44 * s, top: 18 * s, width: 17 * s, height: 17 * s, borderRadius: 99, backgroundColor: fg }} />
      </Animated.View>
      {/* heel, dropped below the step at the bottom (deep stretch) and rising above on toes */}
      <Animated.View style={[{ position: 'absolute', left: 42 * s, top: 84 * s, width: 14 * s, height: 6 * s, borderRadius: 99, backgroundColor: fg }, heel]} />
    </View>
  );
}

// --- Plank: a forearm-plank HOLD with a gentle breathing lift (deliberately not a push-up:
// the forearm stays flat and the arm never straightens). The toes are fixed; the body is one
// straight line pivoting about the toes as the shoulder rises ~7px; the arm bends via IK.
function Plank({ phase, size, fg, bg }: { phase: SharedValue<number>; size: number; fg: string; bg: string }) {
  const s = size / 116;
  const toeX = 96 * s, toeY = 76 * s; // toes planted on the ground (fixed)
  const sh0x = 40 * s, sh0y = 64 * s; // shoulder at the forearm-plank pose (translate anchor)
  const p = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 deep forearm plank → 1 slight lift
  // A small breathing LIFT, not a full push-up: the shoulder rises only ~7px and the forearm
  // stays flat throughout (never straightening to a high plank), so the read stays "plank hold".
  const sh = useDerivedValue(() => { 'worklet'; const q = p(phase.value); return { x: (40 + 1.5 * q) * s, y: (64 - 7 * q) * s }; });
  const hand = useDerivedValue(() => { 'worklet'; const q = p(phase.value); return { x: (26 + 8 * q) * s, y: 76 * s }; });
  // arm IK solved in WORLD coords (translation-invariant), applied inside the follow group
  const ik = useDerivedValue(() => { 'worklet'; return solve2Bar(sh.value.x, sh.value.y, hand.value.x, hand.value.y, 12 * s, 14 * s, -1); });
  // straight body line = a stretch-bone from the fixed toe to the rising shoulder
  const bodyRot = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${Math.atan2(sh.value.y - toeY, sh.value.x - toeX)}rad` }] }; });
  const bodyLen = useAnimatedStyle(() => { 'worklet'; return { width: Math.sqrt((sh.value.x - toeX) ** 2 + (sh.value.y - toeY) ** 2) }; });
  const follow = useAnimatedStyle(() => { 'worklet'; return { transform: [{ translateX: sh.value.x - sh0x }, { translateY: sh.value.y - sh0y }] }; });
  const uarm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ik.value.a}deg` }] }; });
  const fore = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${ik.value.bRel}deg` }] }; });
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, top: 77 * s, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* toes on the ground */}
      <View style={{ position: 'absolute', left: 92 * s, top: 72 * s, width: 9 * s, height: 7 * s, borderRadius: 2 * s, backgroundColor: fg }} />
      {/* straight body line: toe → shoulder (pivot at the fixed toe, animated length) */}
      <Animated.View style={[{ position: 'absolute', left: toeX, top: toeY, width: 0, height: 0 }, bodyRot]}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: -5.5 * s, height: 11 * s, borderRadius: 99, backgroundColor: fg }, bodyLen]} />
      </Animated.View>
      {/* upper body rides the rising shoulder: head + arm (forearm-flat → straight) */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, follow]}>
        <View style={{ position: 'absolute', left: 23 * s, top: 52 * s, width: 17 * s, height: 17 * s, borderRadius: 99, backgroundColor: fg }} />
        <Bone x={sh0x} y={sh0y} len={12 * s} w={8 * s} color={fg} rot={uarm}>
          <Bone x={0} y={0} len={14 * s} w={8 * s} color={fg} rot={fore} />
        </Bone>
      </Animated.View>
    </View>
  );
}

// --- Padel / Tennis: a side-view forehand. The hitting arm (upper arm → forearm → racket)
// sweeps the racket from low-behind to high-in-front; the racket head is equip (apparatus).
// The whole player steps subtly into the shot (a small forward weight shift).
function RacketSwing({ phase, size, fg, bg, equip }: { phase: SharedValue<number>; size: number; fg: string; bg: string; equip: string }) {
  const s = size / 116;
  const shX = 44 * s, shY = 38 * s; // hitting shoulder (arm pivot)
  const p = (v: number) => (1 - Math.cos(v * 2 * Math.PI)) / 2; // 0 backswing → 1 follow-through
  const uarm = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${120 - p(phase.value) * 140}deg` }] }; }); // back-low → front-high
  const fore = { transform: [{ rotate: '-20deg' }] }; // slight constant elbow bend
  // subtle weight shift: the whole player steps a touch forward into the contact
  const step = useAnimatedStyle(() => { 'worklet'; return { transform: [{ translateX: (-1.5 + 3 * p(phase.value)) * s }] }; });
  return (
    <Animated.View style={[{ width: size, height: size }, step]}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.09, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* athletic stance + torso + head + balance arm (static base) */}
      <View style={{ position: 'absolute', left: 40 * s, top: 63 * s, width: 9 * s, height: 34 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '-10deg' }] }} />
      <View style={{ position: 'absolute', left: 49 * s, top: 63 * s, width: 9 * s, height: 34 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '15deg' }] }} />
      <View style={{ position: 'absolute', left: 40 * s, top: 36 * s, width: 11 * s, height: 30 * s, borderRadius: 99, backgroundColor: fg }} />
      <View style={{ position: 'absolute', left: 43 * s, top: 44 * s, width: 7 * s, height: 16 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '35deg' }] }} />
      <View style={{ position: 'absolute', left: 38 * s, top: 16 * s, width: 17 * s, height: 17 * s, borderRadius: 99, backgroundColor: fg }} />
      {/* hitting arm: upper arm → forearm → racket (throat + head ring) */}
      <Bone x={shX} y={shY} len={18 * s} w={8 * s} color={fg} rot={uarm}>
        <Bone x={0} y={0} len={16 * s} w={7 * s} color={fg} rot={fore}>
          {/* racket continues the forearm line: a throat then an open head ring (apparatus) */}
          <View style={{ position: 'absolute', left: 0, top: -2 * s, width: 9 * s, height: 4 * s, borderRadius: 99, backgroundColor: equip }} />
          <View style={{ position: 'absolute', left: 7 * s, top: -9 * s, width: 16 * s, height: 20 * s, borderRadius: 99, borderWidth: 3 * s, borderColor: equip, backgroundColor: 'transparent' }} />
        </Bone>
      </Bone>
    </Animated.View>
  );
}

// --- Jump rope: the rope (one circle's bottom-edge arc) ORBITS around the jumper once per
// cycle; the figure does a small hop, timed so it's at the top of the bob when the rope
// passes under the feet (rope at the bottom = phase 0/1) and grounded when it's overhead.
function JumpRope({ phase, size, fg, bg, equip }: { phase: SharedValue<number>; size: number; fg: string; bg: string; equip: string }) {
  const s = size / 116;
  const rope = useAnimatedStyle(() => { 'worklet'; return { transform: [{ rotate: `${phase.value * 360}deg` }] }; });
  const hop = useAnimatedStyle(() => { 'worklet'; return { transform: [{ translateY: -7 * s * (0.5 + 0.5 * Math.cos(phase.value * 2 * Math.PI)) }] }; });
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: size * 0.08, right: size * 0.08, bottom: size * 0.07, height: 3 * s, borderRadius: 99, backgroundColor: bg }} />
      {/* rope: a circle showing only its bottom-edge arc, rotated about its centre so the
          arc sweeps under the feet → up the side → over the head → down the other side */}
      <Animated.View style={[{ position: 'absolute', left: 10 * s, top: 14 * s, width: 84 * s, height: 84 * s, borderWidth: 3 * s, borderColor: 'transparent', borderBottomColor: equip, borderRadius: 99 }, rope]} />
      {/* the jumper hops within the rope's loop */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, hop]}>
        <View style={{ position: 'absolute', left: 44 * s, top: 22 * s, width: 16 * s, height: 16 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 46 * s, top: 37 * s, width: 10 * s, height: 26 * s, borderRadius: 99, backgroundColor: fg }} />
        <View style={{ position: 'absolute', left: 44 * s, top: 61 * s, width: 8 * s, height: 26 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '-5deg' }] }} />
        <View style={{ position: 'absolute', left: 50 * s, top: 61 * s, width: 8 * s, height: 26 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '5deg' }] }} />
        {/* arms out to the sides holding the handles */}
        <View style={{ position: 'absolute', left: 47 * s, top: 40 * s, width: 7 * s, height: 19 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '40deg' }] }} />
        <View style={{ position: 'absolute', left: 51 * s, top: 40 * s, width: 7 * s, height: 19 * s, borderRadius: 99, backgroundColor: fg, transform: [{ rotate: '-40deg' }] }} />
        <View style={{ position: 'absolute', left: 33 * s, top: 56 * s, width: 8 * s, height: 4 * s, borderRadius: 99, backgroundColor: equip, transform: [{ rotate: '40deg' }] }} />
        <View style={{ position: 'absolute', left: 59 * s, top: 56 * s, width: 8 * s, height: 4 * s, borderRadius: 99, backgroundColor: equip, transform: [{ rotate: '-40deg' }] }} />
      </Animated.View>
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
