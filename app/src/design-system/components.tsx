import type { ReactNode } from 'react';
import {
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, motion, radii, spacing, typography, type TextVariant } from './index';

/** Screen: safe-area + scroll + dark background + comfortable padding. */
export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[{ padding: spacing.xl, gap: spacing.lg }, style]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** AppText: typographic variants, RTL-aware writing direction. */
export function AppText({
  variant = 'body',
  color,
  style,
  ...rest
}: TextProps & { variant?: TextVariant; color?: string }) {
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: color ?? colors.textPrimary, writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
        style,
      ]}
    />
  );
}

/** Card: elevated surface with a hairline border and soft inner spacing. */
export function Card({ style, ...rest }: ViewProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.sm,
        },
        style,
      ]}
    />
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Button: accent pill that springs slightly on press. */
export function Button({ label, onPress }: { label: string; onPress?: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

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
          backgroundColor: colors.accent,
          borderRadius: radii.pill,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          alignItems: 'center',
        },
        animatedStyle,
      ]}
    >
      <AppText variant="title" color={colors.accentInk}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}
