import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  ScrollView,
  I18nManager,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion, radii, spacing, typography, type TextVariant } from './index';
import { useTheme } from './theme';

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

/** AppText: typographic variants, themed color, RTL-aware. */
export function AppText({
  variant = 'body',
  color,
  style,
  ...rest
}: TextProps & { variant?: TextVariant; color?: string }) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: color ?? colors.ink, writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
        style,
      ]}
    />
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
          borderWidth: 2,
          borderColor: colors.border,
          gap: spacing.sm,
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
