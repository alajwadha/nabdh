import { StyleSheet, View, type ViewStyle } from 'react-native';
import { radii, shadow } from './index';
import { useTheme } from './theme';

// Apple "Liquid Glass": a translucent frosted surface. expo-blur is lazy-required so the
// absent native module (web, Expo Go without the plugin, this sandbox) degrades to a
// semi-opaque solid with the same shape — it NEVER breaks layout or legibility.
// eslint-disable-next-line @typescript-eslint/no-var-requires
let Blur: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Blur = require('expo-blur');
} catch {
  Blur = null;
}
const BlurView = Blur?.BlurView ?? null;

export function glassAvailable(): boolean {
  return !!BlurView;
}

type GlassProps = {
  children?: React.ReactNode;
  style?: ViewStyle; // outer: position / margins / radius override
  radius?: number;
  intensity?: number;
  /** subtle = lighter scrim (for big colourful surfaces), strong = more opaque (for dense text) */
  scrim?: 'subtle' | 'strong';
  floating?: boolean; // add the soft drop shadow
};

/** Frosted-glass surface. Caller sets padding via `style`. */
export function Glass({ children, style, radius = radii.xl, intensity, scrim = 'strong', floating = true }: GlassProps) {
  const { mode } = useTheme();
  const dark = mode === 'dark';
  const tint = dark ? 'dark' : 'light';
  // A thin colour wash over the blur keeps text readable regardless of what's behind it.
  // (Only affects the BLUR path; the solid fallback is always near-opaque.)
  const fillAlpha = scrim === 'strong' ? (dark ? 0.55 : 0.6) : dark ? 0.32 : 0.4;
  const fill = dark ? `rgba(28,24,18,${fillAlpha})` : `rgba(255,251,244,${fillAlpha})`;
  const edge = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)';
  const inten = intensity ?? (dark ? 42 : 32);
  // Carry any explicit per-corner radii from `style` onto the blur clip so it matches the
  // outer shape (e.g. a sheet with rounded top, square bottom).
  const corners: ViewStyle = {
    borderTopLeftRadius: style?.borderTopLeftRadius,
    borderTopRightRadius: style?.borderTopRightRadius,
    borderBottomLeftRadius: style?.borderBottomLeftRadius,
    borderBottomRightRadius: style?.borderBottomRightRadius,
  };
  const outer: ViewStyle = { borderRadius: radius, ...(floating ? shadow.soft : null) };
  const inner: ViewStyle = { borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor: edge, ...corners };

  if (BlurView) {
    return (
      <View style={[outer, style]}>
        <BlurView intensity={inten} tint={tint} experimentalBlurMethod="dimezisBlurView" style={inner}>
          {/* tint wash for legibility + a faint top specular highlight */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} pointerEvents="none" />
          <View style={[StyleSheet.absoluteFill, { borderTopWidth: 1.5, borderTopColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.55)', borderRadius: radius }]} pointerEvents="none" />
          {children}
        </BlurView>
      </View>
    );
  }

  // Fallback: a near-opaque solid so it always reads, same shape + edge. Mirror the blur
  // path's two-view structure so the outer shadow isn't clipped by the inner overflow
  // (Android clips elevation under overflow:'hidden').
  const solid = dark ? 'rgba(33,29,22,0.94)' : 'rgba(255,251,244,0.94)';
  return (
    <View style={[outer, style]}>
      <View style={[inner, { backgroundColor: solid }]}>{children}</View>
    </View>
  );
}
