import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Screen, PressCard } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { MoveViz } from '../src/components/MoveViz';
import { EXERCISES } from '../src/data/workouts';
import { PROGRAMS } from '../src/data/programs';
import { Icon } from '../src/components/Icon';

export default function Programs() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const tints = [tiles.mint, tiles.blue, tiles.peach, tiles.lav];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Programs</AppText>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        Pick a routine and Nabdh walks you through it set by set, with your suggested weights, a rest timer, and everything saved to your history.
      </AppText>

      {PROGRAMS.map((p, i) => {
        const tint = tints[i % tints.length];
        const figures = p.exKeys.slice(0, 4).map((k) => EXERCISES.find((e) => e.key === k)).filter(Boolean);
        return (
          <PressCard
            key={p.key}
            onPress={() => router.push({ pathname: '/session', params: { program: p.key } })}
            style={{ gap: spacing.sm }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 46, height: 46, borderRadius: radii.md, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={p.icon} size={22} color={tint.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title">{p.name}</AppText>
                <AppText variant="caption" color={colors.textMuted}>{p.exKeys.length} exercises</AppText>
              </View>
              <AppText variant="caption" color={colors.accentText}>Start ›</AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary} style={{ lineHeight: 17 }}>{p.note}</AppText>
            {/* tiny preview of the first few movements */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 2 }}>
              {figures.map((e) => (
                <View key={e!.key} style={{ backgroundColor: colors.navBg, borderRadius: radii.sm }}>
                  <MoveViz kind={e!.key} emoji={e!.emoji} size={46} />
                </View>
              ))}
            </View>
          </PressCard>
        );
      })}
    </Screen>
  );
}
