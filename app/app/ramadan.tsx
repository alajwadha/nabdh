import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon, type IconName } from '../src/components/Icon';
import { useAppState } from '../src/store/app';
import { ramadanState, fmtCountdown } from '../src/data/fasting';
import { clockLabel, prayerSource, prayerTime } from '../src/data/prayer';
import { usePrayerTimes } from '../src/data/usePrayer';
import { dishById, type Dish } from '../src/data/dishes';

function nowLabel(): string {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

// The live countdown owns the 1-second ticker so only this card re-renders each tick -
// the dish lists below stay put.
function WindowCard() {
  const { colors, tiles } = useTheme();
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const st = ramadanState();
  const fasting = st.phase === 'fasting';
  const iftar = clockLabel(prayerTime('maghrib'));
  const suhoorCut = clockLabel(prayerTime('fajr'));
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: tiles.lav.bg, borderColor: tiles.lav.bg }}>
      <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="moon-star" size={22} color={tiles.lav.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color={tiles.lav.ink} style={{ letterSpacing: 1.2, opacity: 0.8 }}>{fasting ? 'FASTING · IFTAR IN' : 'EATING · SUHOOR ENDS IN'}</AppText>
        <AppText variant="metric" color={tiles.lav.ink} style={{ fontSize: 30, lineHeight: 34 }}>{fmtCountdown(st.secondsLeft)}</AppText>
        <AppText variant="caption" color={tiles.lav.ink} style={{ opacity: 0.9 }}>{fasting ? `Maghrib at ${iftar}` : `Fajr at ${suhoorCut}`}</AppText>
      </View>
    </Card>
  );
}

export default function Ramadan() {
  const { colors, tiles } = useTheme();
  usePrayerTimes();
  const router = useRouter();
  const { ramadan, setRamadan, waterGoal, addMeal } = useAppState();

  const iftar = clockLabel(prayerTime('maghrib'));
  const suhoorCut = clockLabel(prayerTime('fajr'));

  const [added, setAdded] = useState<string | null>(null);
  const add = (d: Dish) => {
    addMeal({ id: `dish-${d.id}-${Date.now()}`, name: d.name, meta: `${nowLabel()} · ${d.serving}`, kcal: d.kcal, color: d.color, protein: d.protein, carbs: d.carbs, fat: d.fat });
    setAdded(d.name);
  };

  // All of today's water has to fit in the Maghrib→Fajr window. Pace it: a couple at iftar,
  // the bulk through the evening, a couple at suhoor.
  const iftarGlasses = Math.min(3, waterGoal);
  const suhoorGlasses = Math.min(2, Math.max(0, waterGoal - iftarGlasses));
  const eveningGlasses = Math.max(0, waterGoal - iftarGlasses - suhoorGlasses);

  const iftarDishes = ['tamr', 'laban', 'harees'].map(dishById).filter(Boolean) as Dish[];
  const suhoorDishes = ['foul', 'tameez', 'tamr'].map(dishById).filter(Boolean) as Dish[];

  const DishRow = ({ d }: { d: Dish }) => (
    <Pressable onPress={() => add(d)} accessibilityRole="button" accessibilityLabel={`Add ${d.name}, ${d.kcal} kcal`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 9 }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: tiles[d.color].bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="utensils" size={16} color={tiles[d.color].ink} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
          <AppText variant="title" style={{ fontSize: 14.5 }}>{d.name}</AppText>
          <AppText variant="caption" color={colors.textMuted}>{d.ar}</AppText>
        </View>
        <AppText variant="caption" color={colors.textMuted}>{d.serving} · {d.kcal} kcal</AppText>
      </View>
      <Icon name="plus" size={17} color={colors.accentText} />
    </Pressable>
  );

  const PaceRow = ({ icon, label, n, last }: { icon: IconName; label: string; n: number; last?: boolean }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 9, borderTopWidth: last ? 0 : 1, borderTopColor: colors.border }}>
      <Icon name={icon} size={17} color={colors.textSecondary} />
      <AppText variant="title" style={{ fontSize: 14.5, flex: 1 }}>{label}</AppText>
      <AppText variant="metric" style={{ fontSize: 16, lineHeight: 18 }} color={tiles.blue.ink}>{n}</AppText>
      <AppText variant="caption" color={colors.textMuted}>glasses</AppText>
    </View>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Ramadan</AppText>
      </View>

      {/* current window (owns its own ticker) */}
      <WindowCard />

      {!ramadan && (
        <Pressable onPress={() => setRamadan(true)} accessibilityRole="button" accessibilityLabel="Enable Ramadan mode" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.navBg, borderRadius: radii.lg, padding: spacing.md }}>
          <Icon name="moon-star" size={16} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>Ramadan mode is off. Turn it on to surface this across the app.</AppText>
          <AppText variant="caption" color={colors.accentText}>Enable</AppText>
        </Pressable>
      )}

      {added && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tiles.mint.bg, borderRadius: radii.lg, padding: spacing.md }}>
          <Icon name="check" size={16} color={tiles.mint.ink} />
          <AppText variant="caption" color={tiles.mint.ink} style={{ flex: 1 }}>Added {added} to today’s log.</AppText>
        </View>
      )}

      {/* Iftar */}
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="sunset" size={18} color={tiles.peach.ink} />
          <AppText variant="title" style={{ flex: 1 }}>Iftar · {iftar}</AppText>
        </View>
        <AppText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>
          Break with 2-3 dates and water, pray Maghrib, then come back for a balanced plate, protein, vegetables and slow carbs. Ease in so you don’t overeat.
        </AppText>
        <View style={{ marginTop: 2 }}>{iftarDishes.map((d) => <DishRow key={d.id} d={d} />)}</View>
      </Card>

      {/* Suhoor */}
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="sunrise" size={18} color={tiles.gold.ink} />
          <AppText variant="title" style={{ flex: 1 }}>Suhoor · before {suhoorCut}</AppText>
        </View>
        <AppText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>
          Favour slow-release carbs and protein (foul, eggs, oats, laban) plus plenty of water, they carry you through the fast. Go easy on salt and sugar so you’re less thirsty.
        </AppText>
        <View style={{ marginTop: 2 }}>{suhoorDishes.map((d) => <DishRow key={d.id} d={d} />)}</View>
      </Card>

      {/* Hydration catch-up */}
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="droplets" size={18} color={tiles.blue.ink} />
          <AppText variant="title" style={{ flex: 1 }}>Hydration catch-up</AppText>
          <AppText variant="metric" style={{ fontSize: 18, lineHeight: 20 }} color={tiles.blue.ink}>{waterGoal}</AppText>
          <AppText variant="caption" color={colors.textMuted}>glasses</AppText>
        </View>
        <AppText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>
          None of it can happen during the fast, so pace your day’s water across the evening:
        </AppText>
        <View>
          <PaceRow icon="sunset" label="At iftar" n={iftarGlasses} />
          <PaceRow icon="moon-star" label="Through the evening" n={eveningGlasses} />
          <PaceRow icon="sunrise" label="At suhoor" n={suhoorGlasses} last />
        </View>
      </Card>

      <Button label="Open the fasting timer" variant="line" onPress={() => router.navigate('/fasting')} />

      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        {prayerSource() === 'location' ? 'Prayer times are calculated for your location.' : 'Prayer times are demo values for Riyadh.'} Guidance is general, adjust to how you feel.
      </AppText>
    </Screen>
  );
}
