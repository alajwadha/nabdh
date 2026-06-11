import { useEffect } from 'react';
import { TextInput, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../design-system';

// Values count up rather than popping in (premium feel).
// @ts-ignore - guarded for Reanimated version differences
Animated.addWhitelistedNativeProps?.({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function AnimatedCounter({
  value,
  duration = 900,
  style,
}: {
  value: number;
  duration?: number;
  style?: TextStyle;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value, duration, progress]);

  const animatedProps = useAnimatedProps(() => {
    const display = String(Math.round(progress.value));
    return { text: display, defaultValue: display } as any;
  });

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      value={String(Math.round(value))}
      animatedProps={animatedProps}
      style={[{ color: colors.textPrimary, fontSize: 40, fontWeight: '700', padding: 0 }, style]}
    />
  );
}
