import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { AppText } from '../design-system/components';
import { spacing } from '../design-system';
import { useTheme } from '../design-system/theme';
import { Hero } from './Dashboard';

const W = Math.min(Dimensions.get('window').width, 393) - spacing.xl * 2;

type Slide = { key: string; bg: string; render: () => React.ReactNode };

export function InsightHero({
  readiness,
  onOpen,
}: {
  readiness: number | null;
  onOpen: (key: string) => void;
}) {
  const { colors } = useTheme();
  const [idx, setIdx] = useState(0);

  const L = (s: string) => (
    <AppText variant="caption" color="rgba(255,255,255,0.78)" style={{ letterSpacing: 2 }}>
      {s}
    </AppText>
  );
  const B = (s: string) => (
    <AppText variant="title" color="#fff" style={{ marginTop: 6, lineHeight: 21 }}>
      {s}
    </AppText>
  );
  const tag = (s: string) => (
    <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingVertical: 5, paddingHorizontal: 10, marginBottom: 9 }}>
      <AppText variant="caption" color="#fff" style={{ fontSize: 10, letterSpacing: 1 }}>
        {s}
      </AppText>
    </View>
  );

  const slides: Slide[] = [
    {
      key: 'readiness',
      bg: colors.accentDeep,
      render: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <AppText style={{ fontSize: 72, lineHeight: 74, fontWeight: '800', color: '#fff', minWidth: 100 }}>
            {readiness != null ? readiness : '--'}
          </AppText>
          <View style={{ flex: 1 }}>
            {L('READINESS')}
            {B('HRV dipped a third night — recovery beats grind today.')}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 11 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={{ width: 26, height: 8, borderRadius: 99, backgroundColor: i < 3 ? colors.yellow : 'rgba(255,255,255,0.25)' }} />
              ))}
            </View>
          </View>
        </View>
      ),
    },
    {
      key: 'hrv',
      bg: '#4A3F9E',
      render: () => (
        <View>
          {tag('⚠ HEADS-UP')}
          {L('PREDICTIVE')}
          {B("3rd night of low HRV. Tomorrow's energy will dip — go light today and it rebounds by Saturday.")}
          <AppText variant="caption" color="#fff" style={{ marginTop: 10 }}>
            See HRV trend ›
          </AppText>
        </View>
      ),
    },
    {
      key: 'plan',
      bg: colors.accentDeep,
      render: () => (
        <View>
          {L("TODAY'S FOCUS · RECOVER")}
          <View style={{ marginTop: 9, gap: 5 }}>
            {['🍽  Protein lunch — done ✓', '🚶  Easy 30-min walk after Asr', '🌙  Lights out by 11:15'].map((s) => (
              <AppText key={s} variant="caption" color="#fff" style={{ fontSize: 12 }}>
                {s}
              </AppText>
            ))}
          </View>
        </View>
      ),
    },
    {
      key: 'saudi',
      bg: '#C2562C',
      render: () => (
        <View>
          {tag('🌡 RIYADH · 43°C')}
          {L('PLAN AROUND THE HEAT')}
          {B('Peak heat 1–4 PM. Move your walk to after Asr (3:18) — cooler, and your steps land best then anyway.')}
        </View>
      ),
    },
    {
      key: 'trends',
      bg: '#27607F',
      render: () => (
        <View>
          {L('THIS WEEK')}
          {B('Resting HR is up 4 bpm over 7 days, sleep is trending the right way. Your full week is ready.')}
          <AppText variant="caption" color="#fff" style={{ marginTop: 10 }}>
            Open Trends ›
          </AppText>
        </View>
      ),
    },
  ];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIdx(Math.round(e.nativeEvent.contentOffset.x / W));
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ width: W }}
      >
        {slides.map((s) => (
          <Pressable key={s.key} onPress={() => onOpen(s.key)} style={{ width: W }}>
            <Hero bg={s.bg}>{s.render()}</Hero>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 10 }}>
        {slides.map((s, i) => (
          <View
            key={s.key}
            style={{ width: i === idx ? 20 : 7, height: 7, borderRadius: 99, backgroundColor: i === idx ? colors.accentText : colors.border }}
          />
        ))}
      </View>
    </View>
  );
}
