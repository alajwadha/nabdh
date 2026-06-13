import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText, Button } from '../src/design-system/components';
import { spacing } from '../src/design-system';

const W = Dimensions.get('window').width;

type Page = { bg: string; kicker: string; big: string; line: string; share?: boolean };

const PAGES: Page[] = [
  { bg: '#2E7D5B', kicker: 'JUN 7 – JUN 13', big: 'Your week,\nAli 👋', line: 'Seven days, a few wins, one lesson. Here’s how your body did.' },
  { bg: '#4A3F9E', kicker: 'SLEEP', big: '7h 02m', line: 'average a night — your best night was Thursday at 82. Bedtime drifted ±38 min; tightening that is next week’s quest.' },
  { bg: '#27607F', kicker: 'RECOVERY', big: '68', line: 'average readiness, with 3 green days. The dip came mid-week after late karak — your data doesn’t lie ☕.' },
  { bg: '#C2562C', kicker: 'MOVEMENT', big: '61,204', line: 'steps this week — 5 of them after Asr, your favourite window. That’s 28 km on foot 🚶.' },
  { bg: '#8A6312', kicker: 'FOOD', big: '12-day\nstreak 🔥', line: 'You hit your protein goal 5 of 7 days, and kabsa showed up 3 times. Hydration is your one gap.' },
  { bg: '#2E7D5B', kicker: 'COACH’S NOTE', big: 'Recover,\nthen push.', line: 'You ended tired but consistent. Next week: protect bedtime and skip late karak — readiness should clear 75.', share: true },
];

export default function Wrapped() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W));

  return (
    <View style={{ flex: 1, backgroundColor: PAGES[idx].bg }}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {PAGES.map((p, i) => (
          <View key={i} style={{ width: W, backgroundColor: p.bg, padding: 30, justifyContent: 'center' }}>
            <AppText variant="caption" color="rgba(255,255,255,0.7)" style={{ letterSpacing: 2, marginBottom: 14 }}>
              {p.kicker}
            </AppText>
            <AppText style={{ fontSize: 48, lineHeight: 50, fontWeight: '800', color: '#fff', letterSpacing: -2, marginBottom: 14 }}>
              {p.big}
            </AppText>
            <AppText variant="body" color="rgba(255,255,255,0.92)" style={{ fontSize: 15, lineHeight: 23, maxWidth: 300 }}>
              {p.line}
            </AppText>
            {p.share && <Button label="Share my week" variant="dark" style={{ marginTop: spacing.xl, backgroundColor: '#fff' }} onPress={() => router.back()} />}
          </View>
        ))}
      </ScrollView>

      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 18, paddingTop: 8 }}>
          {PAGES.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i <= idx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 10 }}>
          <AppText style={{ fontWeight: '800', fontSize: 15, color: '#fff' }}>
            Nabdh<AppText color="#7FE0B4" style={{ fontSize: 15, fontWeight: '800' }}>.</AppText> · your week
          </AppText>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <AppText style={{ fontSize: 20, color: '#fff' }}>✕</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
