import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Chip } from '../../src/design-system/components';
import { AppHeader } from '../../src/components/AppHeader';
import { radii, spacing } from '../../src/design-system';
import { useTheme } from '../../src/design-system/theme';
import { useAppState } from '../../src/store/app';
import { useHealth } from '../../src/store/health';
import { useIdentity } from '../../src/data/identity';
import { DEMO_SUMMARY } from '../../src/integrations/demo';

type Msg = { id: number; from: 'c' | 'u'; text: string };
type CoachCtx = { hrv?: number; water: number; steps?: number };

function reply(text: string, ctx: CoachCtx): string {
  const t = text.toLowerCase();
  if (/walk|مشي|asr/.test(t)) return 'Logged the walk ✓ — that easy session is exactly the recovery dose today.';
  if (/dinner|عشاء|kabsa|كبسة|eat|food|كل/.test(t)) return 'Keep tonight under 500 kcal and protein-forward — shorbat adas or grilled fish fits your budget.';
  if (/sleep|نوم|bed|tired|تعب/.test(t)) return 'Lights out by 11:15 tonight — that pays your sleep debt and pushes HRV back toward baseline.';
  if (/water|ماء|hydrat/.test(t)) return `You’re at ${ctx.water} of 8 glasses. Front-load ${Math.max(0, 8 - ctx.water)} before Dhuhr while it’s this hot.`;
  if (/stress|قلق/.test(t)) return 'Your stress peaked before Dhuhr. Try the 1-minute breath — it flattened your spikes last week.';
  if (/ramadan|صوم|fast|iftar|suhoor/.test(t)) return 'In Ramadan I shift everything around iftar & suhoor — break gently with dates, hydrate across the night.';
  if (/why|ليش|how/.test(t)) return `HRV is at ${ctx.hrv ?? '—'} ms, down a third night, so today is recovery, not load. One disciplined day usually clears it.`;
  return 'Got it. I’d keep it light today — easy walk after Asr, light dinner, early night. Want me to adjust the plan?';
}

const CHIPS: [string, string][] = [
  ['Walk done ✓', 'walk done'],
  ['Why 500 kcal?', 'why 500 kcal'],
  ['Can I lift instead?', 'can I lift weights instead'],
];

export default function Coach() {
  const { colors, tiles } = useTheme();
  const { toggleTask, water } = useAppState();
  const { summary } = useHealth();
  const identity = useIdentity();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);
  const ctx: CoachCtx = { hrv: s?.hrvSdnn, water, steps: s?.steps };
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 1,
      from: 'c',
      text: `Sabah alkhair, ${identity.firstName} ☀️ HRV is at ${s?.hrvSdnn ?? '—'} ms, down a third night — today we recover, not grind.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [usedChips, setUsedChips] = useState<string[]>([]);
  const idRef = useRef(2);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const userMsg: Msg = { id: idRef.current++, from: 'u', text: t };
    setMsgs((m) => [...m, userMsg]);
    if (/walk/i.test(t)) toggleTask('walk');
    setTimeout(() => {
      setMsgs((m) => [...m, { id: idRef.current++, from: 'c', text: reply(t, ctx) }]);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 900);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <AppHeader />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: colors.border, marginTop: spacing.sm }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ fontSize: 20 }}>🫀</AppText>
            </View>
            <View>
              <AppText variant="title">Your coach</AppText>
              <AppText variant="caption" color={colors.accentText}>
                ● online · knows today’s data
              </AppText>
            </View>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }} showsVerticalScrollIndicator={false}>
          {msgs.map((m) => (
            <View
              key={m.id}
              style={{
                maxWidth: '84%',
                alignSelf: m.from === 'u' ? 'flex-end' : 'flex-start',
                backgroundColor: m.from === 'u' ? colors.accent : colors.card,
                borderWidth: m.from === 'u' ? 0 : 2,
                borderColor: colors.border,
                borderRadius: radii.lg,
                borderBottomRightRadius: m.from === 'u' ? 6 : radii.lg,
                borderBottomLeftRadius: m.from === 'c' ? 6 : radii.lg,
                padding: spacing.md,
              }}
            >
              <AppText variant="body" color={m.from === 'u' ? '#fff' : colors.ink} style={{ fontSize: 13 }}>
                {m.text}
              </AppText>
            </View>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {CHIPS.map(([label, q], i) => {
              const palette = [tiles.mint, tiles.lav, tiles.peach][i];
              return (
                <Chip
                  key={q}
                  label={label}
                  bg={palette.bg}
                  fg={palette.ink}
                  faded={usedChips.includes(q)}
                  onPress={() => {
                    setUsedChips((u) => [...u, q]);
                    send(q);
                  }}
                />
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingBottom: Math.max(spacing.md, insets.bottom) }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message your coach…"
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={() => { send(input); setInput(''); }}
              style={{ flex: 1, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: 99, paddingVertical: 13, paddingHorizontal: 17, fontSize: 13, color: colors.ink }}
            />
            <Pressable
              onPress={() => { send(input); setInput(''); }}
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
            >
              <AppText color="#fff" style={{ fontSize: 17 }}>
                ➤
              </AppText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
