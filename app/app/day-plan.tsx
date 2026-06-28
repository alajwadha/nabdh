import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Card, Screen } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { dayPlan, nowMins, type PlanItem } from '../src/data/dayplan';

function Rail({ item, past, isLast, now }: { item: PlanItem; past: boolean; isLast: boolean; now: boolean }) {
  const { colors, tiles } = useTheme();
  const prayer = item.kind === 'prayer';
  const dotColor = item.highlight ? colors.accent : prayer ? colors.accentText : colors.border;
  const iconBg = item.highlight ? colors.accent : prayer ? colors.navOn : tiles.peach.bg;
  const iconColor = item.highlight ? colors.accentInk : prayer ? colors.navOnText : tiles.peach.ink;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, opacity: past ? 0.45 : 1 }}>
      {/* time + rail */}
      <View style={{ width: 64, alignItems: 'flex-end', paddingTop: 6 }}>
        <AppText variant="caption" color={now ? colors.accentText : colors.textMuted} style={{ fontVariant: ['tabular-nums'], fontWeight: now ? '800' : '600' }}>{item.time}</AppText>
      </View>
      <View style={{ alignItems: 'center', width: 40 }}>
        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={item.icon} size={20} color={iconColor} />
        </View>
        {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: colors.border, marginTop: 2 }} />}
      </View>
      {/* content */}
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.lg }}>
        {item.highlight ? (
          <View style={{ backgroundColor: tiles.mint.bg, borderRadius: radii.lg, padding: spacing.md, marginTop: -2 }}>
            <AppText variant="title" color={tiles.mint.ink} style={{ fontSize: 15 }}>{item.label}</AppText>
            {item.sub && <AppText variant="caption" color={tiles.mint.ink} style={{ opacity: 0.9, marginTop: 1 }}>{item.sub}</AppText>}
          </View>
        ) : (
          <View style={{ paddingTop: 7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText variant="title" style={{ fontSize: 15 }}>{item.label}</AppText>
              {prayer && <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1 }}>PRAYER</AppText>}
            </View>
            {item.sub && <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 1 }}>{item.sub}</AppText>}
          </View>
        )}
      </View>
    </View>
  );
}

export default function DayPlan() {
  const { colors } = useTheme();
  const router = useRouter();
  const items = dayPlan();
  const now = nowMins();
  // index of the next upcoming item, to flag "now"
  const nextIdx = items.findIndex((it) => it.mins >= now);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Your day</AppText>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        Meals and training laid out around today’s prayers — with your main session parked in the cool post-Asr window.
      </AppText>

      <Card style={{ gap: spacing.lg }}>
        {items.map((it, i) => (
          <Rail key={`${it.kind}-${it.label}-${it.mins}`} item={it} past={it.mins < now} isLast={i === items.length - 1} now={i === nextIdx} />
        ))}
      </Card>

      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Prayer times are demo values for Riyadh. Blocks are suggestions you can shift around your day.
      </AppText>
    </Screen>
  );
}
