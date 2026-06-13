import { Pressable, View } from 'react-native';
import { AppText, Card, Screen } from '../../src/design-system/components';
import { AppHeader } from '../../src/components/AppHeader';
import { CoachCard } from '../../src/components/Dashboard';
import { radii, spacing } from '../../src/design-system';
import { useTheme } from '../../src/design-system/theme';
import { useAppState } from '../../src/store/app';

const MACROS: [string, string, number, string][] = [
  ['PROTEIN', '92g', 0.76, '#2E7D5B'],
  ['CARBS', '141g', 0.64, '#E0A24E'],
  ['FAT', '48g', 0.58, '#8E81D6'],
];

export default function Food() {
  const { colors, tiles } = useTheme();
  const { water, addWater, meals, kcal, budget } = useAppState();
  const left = Math.max(0, budget - kcal);

  return (
    <Screen>
      <AppHeader />
      <AppText variant="h1" style={{ marginTop: spacing.sm }}>
        Food diary
      </AppText>
      <AppText variant="caption" color={colors.textMuted}>
        Thursday · budget {budget.toLocaleString()} kcal · 🔥 12-day streak
      </AppText>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="h2">
            {kcal.toLocaleString()} <AppText variant="caption" color={colors.textMuted}>/ {budget.toLocaleString()} kcal</AppText>
          </AppText>
          <AppText variant="caption" color={colors.accentText}>
            {left} left
          </AppText>
        </View>
        <View style={{ height: 13, borderRadius: 99, backgroundColor: colors.navBg, overflow: 'hidden', marginTop: 4 }}>
          <View style={{ width: `${Math.min(100, (kcal / budget) * 100)}%`, height: '100%', borderRadius: 99, backgroundColor: colors.accent }} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          {MACROS.map(([k, v, w, c]) => (
            <View key={k} style={{ flex: 1 }}>
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 9, letterSpacing: 1, textAlign: 'center' }}>
                {k}
              </AppText>
              <AppText variant="title" style={{ textAlign: 'center', marginTop: 2 }}>
                {v}
              </AppText>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.navBg, marginTop: 5, overflow: 'hidden' }}>
                <View style={{ width: `${w * 100}%`, height: '100%', backgroundColor: c, borderRadius: 99 }} />
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4 }}>
          WATER · GOAL 8 GLASSES
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                style={{ width: 20, height: 27, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 9, borderBottomRightRadius: 9, borderWidth: 2, backgroundColor: i < water ? '#9CCFE8' : colors.navBg, borderColor: i < water ? '#6FB4D8' : colors.border }}
              />
            ))}
          </View>
          <Pressable onPress={addWater} style={{ backgroundColor: colors.navOn, borderRadius: 99, paddingVertical: 11, paddingHorizontal: 16 }}>
            <AppText variant="caption" color={colors.navOnText}>
              ＋ Glass
            </AppText>
          </Pressable>
        </View>
      </Card>

      {meals.map((m) => (
        <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.lg, padding: 12 }}>
          <View style={{ width: 50, height: 50, borderRadius: 17, backgroundColor: tiles[m.color].bg }} />
          <View style={{ flex: 1 }}>
            <AppText variant="title">{m.name}</AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '500' }}>
              {m.meta}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="h2" style={{ fontSize: 15 }}>
              {m.kcal}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 9.5 }}>
              kcal
            </AppText>
          </View>
        </View>
      ))}

      <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radii.lg, padding: 14, alignItems: 'center' }}>
        <AppText variant="caption" color={colors.textMuted}>
          Dinner — keep it under {left} kcal to stay on plan
        </AppText>
      </View>

      <CoachCard>Protein’s done for the day. Something light tonight: shorbat adas would fit perfectly.</CoachCard>
    </Screen>
  );
}
