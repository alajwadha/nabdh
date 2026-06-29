import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen, SectionHeader } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { useSocial } from '../src/store/social';
import { initials, leaderboard, myRank, type Friend } from '../src/data/social';

const ordinal = (n: number) => {
  const t = n % 100;
  const u = n % 10;
  const s = t >= 11 && t <= 13 ? 'th' : u === 1 ? 'st' : u === 2 ? 'nd' : u === 3 ? 'rd' : 'th';
  return `${n}${s}`;
};

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 8, borderRadius: 99, backgroundColor: colors.navBg, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.max(2, pct))}%`, height: '100%', borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}

function Avatar({ name, sel }: { name: string; sel: boolean }) {
  const { colors, tiles } = useTheme();
  return (
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: sel ? colors.accent : tiles.blue.bg, alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="caption" color={sel ? colors.accentInk : tiles.blue.ink} style={{ fontWeight: '700' }}>{initials(name)}</AppText>
    </View>
  );
}

function Row({ rank, friend }: { rank: number; friend: Friend }) {
  const { colors, tiles } = useTheme();
  const top = rank <= 3;
  const sel = !!friend.you;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 10,
        paddingHorizontal: sel ? spacing.md : 0,
        marginHorizontal: sel ? -spacing.md : 0,
        borderRadius: radii.lg,
        backgroundColor: sel ? tiles.mint.bg : 'transparent',
      }}
    >
      <View style={{ width: 26, alignItems: 'center' }}>
        {top ? (
          <Icon name="trophy" size={18} color={rank === 1 ? '#C79A2E' : rank === 2 ? '#9AA0A6' : '#B07A4A'} />
        ) : (
          <AppText variant="metric" style={{ fontSize: 16, lineHeight: 18 }} color={colors.textMuted}>{rank}</AppText>
        )}
      </View>
      <Avatar name={friend.name} sel={sel} />
      <View style={{ flex: 1 }}>
        <AppText variant="title" style={{ fontSize: 15 }}>{friend.you ? 'You' : friend.name}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="flame" size={12} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted}>{friend.streak}-day streak</AppText>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AppText variant="metric" style={{ fontSize: 19, lineHeight: 22 }} color={sel ? tiles.mint.ink : colors.ink}>{friend.minutes}</AppText>
        <AppText variant="caption" color={colors.textMuted}>min</AppText>
      </View>
    </View>
  );
}

export default function Social() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { friends, challenges, toggleJoin } = useSocial();

  const ranked = leaderboard(friends);
  const rank = myRank(friends);
  const me = friends.find((f) => f.you);
  const tintMap = { mint: tiles.mint, blue: tiles.blue, peach: tiles.peach, lav: tiles.lav, gold: tiles.gold, pink: tiles.pink };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Friends</AppText>
      </View>

      {/* your rank hero */}
      {me && (
        <View style={{ backgroundColor: colors.navOn, borderRadius: radii.xl, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: tiles.gold.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="trophy" size={26} color={tiles.gold.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.navOnText} style={{ letterSpacing: 1.2, opacity: 0.7 }}>YOUR RANK THIS WEEK</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <AppText variant="metric" color={colors.navOnText} style={{ fontSize: 34, lineHeight: 38 }}>{ordinal(rank)}</AppText>
              <AppText variant="caption" color={colors.navOnText} style={{ opacity: 0.7 }}>of {friends.length} · {me.minutes} min</AppText>
            </View>
          </View>
        </View>
      )}

      {/* leaderboard */}
      <Card style={{ gap: 0 }}>
        <SectionHeader title="Leaderboard · active minutes" />
        {ranked.map((f, i) => (
          <View key={f.id}>
            {i > 0 && <View style={{ height: 1, backgroundColor: colors.border }} />}
            <Row rank={i + 1} friend={f} />
          </View>
        ))}
      </Card>

      {/* challenges */}
      <SectionHeader title="Challenges" />
      {challenges.map((c) => {
        const tint = tintMap[c.tint];
        const pct = c.goal > 0 ? Math.round((c.progress / c.goal) * 100) : 0;
        return (
          <Card key={c.id} style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={c.icon} size={22} color={tint.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title">{c.title}</AppText>
                <AppText variant="caption" color={colors.textMuted}>{c.blurb}</AppText>
              </View>
            </View>

            {c.joined ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                    <AppText variant="metric" style={{ fontSize: 20, lineHeight: 22 }} color={tint.ink}>{c.progress}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>/ {c.goal} {c.unit}</AppText>
                  </View>
                  <AppText variant="caption" color={colors.textMuted}>{pct}%</AppText>
                </View>
                <ProgressBar pct={pct} color={tint.ink} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Icon name="users" size={13} color={colors.textMuted} />
                    <AppText variant="caption" color={colors.textMuted}>{c.participants} in · {c.daysLeft}d left</AppText>
                  </View>
                  <Pressable onPress={() => toggleJoin(c.id)} hitSlop={8}>
                    <AppText variant="caption" color={colors.textMuted}>Leave</AppText>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Icon name="users" size={13} color={colors.textMuted} />
                  <AppText variant="caption" color={colors.textMuted}>{c.participants} in · {c.daysLeft}d left</AppText>
                </View>
                <Button label="Join" variant="line" style={{ paddingVertical: 8, paddingHorizontal: spacing.lg }} onPress={() => toggleJoin(c.id)} />
              </View>
            )}
          </Card>
        );
      })}

      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 2 }}>
        Friends & challenges are a preview with sample data, connecting real friends is coming soon.
      </AppText>
    </Screen>
  );
}
