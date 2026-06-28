import { useEffect, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  ScrollView,
  I18nManager,
  type LayoutChangeEvent,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion, radii, shadow, spacing, typography, type TextVariant } from './index';
import { useTheme } from './theme';
import { Icon, type IconName } from '../components/Icon';

/** Screen: safe-area + scroll + themed background + comfortable padding. */
export function Screen({
  children,
  style,
  scroll = true,
}: {
  children: ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
}) {
  const { colors } = useTheme();
  const body = (
    <View style={[{ padding: spacing.xl, gap: spacing.lg, flexGrow: 1 }, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false}>{body}</ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{body}</View>
      )}
    </SafeAreaView>
  );
}

// Per-weight font families. Latin = Plus Jakarta Sans, Arabic = Tajawal (both geometric
// humanist sans, so they pair cleanly). A specific-weight font file means fontWeight is
// encoded in the family, so we resolve the family from the effective weight.
const LATIN_FAMILY: Record<string, string> = { '400': 'Jakarta-Medium', '500': 'Jakarta-Medium', '600': 'Jakarta-Bold', '700': 'Jakarta-Bold', '800': 'Jakarta-ExtraBold', '900': 'Jakarta-ExtraBold' };
const ARABIC_FAMILY: Record<string, string> = { '400': 'Tajawal-Regular', '500': 'Tajawal-Medium', '600': 'Tajawal-Bold', '700': 'Tajawal-Bold', '800': 'Tajawal-ExtraBold', '900': 'Tajawal-ExtraBold' };
const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

function containsArabic(node: ReactNode): boolean {
  if (node == null || typeof node === 'boolean' || typeof node === 'number') return false;
  if (typeof node === 'string') return ARABIC_RE.test(node);
  if (Array.isArray(node)) return node.some(containsArabic);
  const ch = (node as { props?: { children?: ReactNode } })?.props?.children;
  return ch != null ? containsArabic(ch) : false;
}

// Last fontWeight found in a (possibly nested/array) style prop.
function weightFromStyle(style: TextProps['style']): string | undefined {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    for (let i = style.length - 1; i >= 0; i--) {
      const w = weightFromStyle(style[i] as TextProps['style']);
      if (w) return w;
    }
    return undefined;
  }
  const w = (style as TextStyle).fontWeight;
  return w != null ? String(w) : undefined;
}

/** AppText: typographic variants, themed color, RTL-aware, real fonts (Latin + Arabic). */
export function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: TextProps & { variant?: TextVariant; color?: string }) {
  const { colors } = useTheme();
  const base = typography[variant] as TextStyle;
  const weight = weightFromStyle(style) ?? String(base.fontWeight ?? '500');
  const arabic = containsArabic(children);
  const fontFamily = (arabic ? ARABIC_FAMILY : LATIN_FAMILY)[weight] ?? (arabic ? 'Tajawal-Regular' : 'Jakarta-Medium');
  return (
    <Text
      {...rest}
      style={[
        base,
        { color: color ?? colors.ink, fontFamily, writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Card: themed surface with a hairline border and soft inner spacing. */
export function Card({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.sm,
          ...shadow.soft, // real elevation — was flat cream-on-cream before
        },
        style,
      ]}
    />
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export type ButtonVariant = 'solid' | 'line' | 'dark';

/** Button: pill that springs slightly on press. */
export function Button({
  label,
  onPress,
  variant = 'solid',
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg =
    variant === 'solid' ? colors.accent : variant === 'dark' ? colors.navOn : 'transparent';
  const fg =
    variant === 'solid' ? colors.accentInk : variant === 'dark' ? colors.navOnText : colors.ink;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, motion.spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motion.spring);
      }}
      style={[
        {
          backgroundColor: bg,
          borderRadius: radii.pill,
          paddingVertical: spacing.md + 2,
          paddingHorizontal: spacing.xl,
          alignItems: 'center',
          borderWidth: variant === 'line' ? 2 : 0,
          borderColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    >
      <AppText variant="title" color={fg}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

/** Small uppercase section label + optional trailing action. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
      }}
    >
      <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4 }}>
        {title.toUpperCase()}
      </AppText>
      {action}
    </View>
  );
}

/** Rounded chip / pill used for quick actions and tags. */
export function Chip({
  label,
  onPress,
  bg,
  fg,
  faded,
}: {
  label: string;
  onPress?: () => void;
  bg?: string;
  fg?: string;
  faded?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: bg ?? colors.navBg,
        borderRadius: radii.pill,
        paddingVertical: spacing.sm + 3,
        paddingHorizontal: spacing.md + 3,
        opacity: faded ? 0.4 : 1,
      }}
    >
      <AppText variant="caption" color={fg ?? colors.ink} style={{ fontSize: 12.5 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Bottom sheet built on the native Modal (reliable, no gesture wiring). */
export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,12,8,0.45)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: colors.bg,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl,
          maxHeight: '88%',
        }}
      >
        <View
          style={{
            width: 44,
            height: 5,
            borderRadius: 99,
            backgroundColor: colors.border,
            alignSelf: 'center',
            marginBottom: spacing.md,
          }}
        />
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

/** Animated switch: the thumb springs across and the track colour transitions. One shared
 * component (was duplicated inline in 3 screens). Pure display — wrap in a Pressable to toggle. */
export function Toggle({ on }: { on: boolean }) {
  const { colors } = useTheme();
  const p = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(on ? 1 : 0, { damping: 18, stiffness: 220, mass: 0.6 });
  }, [on, p]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [colors.border, colors.accent]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: 3 + p.value * 19 }] }));
  return (
    <Animated.View style={[{ width: 46, height: 27, borderRadius: 99, justifyContent: 'center' }, track]}>
      <Animated.View style={[{ width: 21, height: 21, borderRadius: 99, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 2.5, shadowOffset: { width: 0, height: 1 }, elevation: 2 }, thumb]} />
    </Animated.View>
  );
}

export type SegOption<T extends string> = { value: T; label: string; icon?: IconName };

/** Segmented control with a sliding pill indicator (Reanimated). Replaces the inline
 * pill-switches re-implemented across the app. `dark` uses the ink pill (nav style). */
export function SegmentedControl<T extends string>({ options, value, onChange, dark, style }: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  dark?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const n = options.length;
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const seg = w > 0 ? (w - 8) / n : 0; // inner width per segment (row has 4px padding each side)
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(idx * seg, { damping: 20, stiffness: 200 });
  }, [idx, seg, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: seg }));
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const fg = (sel: boolean) => (sel ? (dark ? colors.navOnText : colors.ink) : colors.textMuted);
  return (
    <View onLayout={onLayout} style={[{ flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: radii.pill, padding: 4 }, style]}>
      {w > 0 && (
        <Animated.View style={[{ position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: radii.pill, backgroundColor: dark ? colors.navOn : colors.card }, indicator]} />
      )}
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={{ flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' }}>
            {o.icon && <Icon name={o.icon} size={15} color={fg(sel)} />}
            <AppText variant="caption" color={fg(sel)} style={{ fontSize: 12.5 }}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Card that springs slightly on press (tactile feedback for tappable cards/rows). */
export function PressCard({ onPress, onLongPress, children, style }: { onPress?: () => void; onLongPress?: () => void; children: ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => { scale.value = withSpring(0.98, motion.spring); }}
      onPressOut={() => { scale.value = withSpring(1, motion.spring); }}
      style={[
        { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, ...shadow.soft },
        a,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
