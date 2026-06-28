import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { AppText, Chip } from '../../src/design-system/components';
import { AppHeader } from '../../src/components/AppHeader';
import { radii, spacing } from '../../src/design-system';
import { useTheme } from '../../src/design-system/theme';
import { useAppState } from '../../src/store/app';
import { useHealth } from '../../src/store/health';
import { useIdentity } from '../../src/data/identity';
import { DEMO_SUMMARY } from '../../src/integrations/demo';

type Msg = { id: number; from: 'c' | 'u'; text: string };

const CHIPS: [string, string][] = [
  ['تمرين اليوم؟', 'هل يجب أن أتمرن اليوم؟'],
  ['ماذا آكل؟', 'ماذا أكل في العشاء الليلة؟'],
  ['نومي سيء', 'نومي كان سيئاً الليلة الماضية، ماذا أفعل؟'],
];

export default function Coach() {
  const { colors, tiles } = useTheme();
  const { toggleTask, water, ramadan } = useAppState();
  const { summary } = useHealth();
  const identity = useIdentity();
  const s = summary ?? (__DEV__ ? DEMO_SUMMARY : null);
  const insets = useSafeAreaInsets();

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 1,
      from: 'c',
      text: `صباح الخير ${identity.firstName} ☀️\nمعدل تقلب ضربات القلب اليوم ${s?.hrvSdnn ?? '—'} ms — يوم تعافٍ، لا يوم إجهاد.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usedChips, setUsedChips] = useState<string[]>([]);
  const idRef = useRef(2);
  const scrollRef = useRef<ScrollView>(null);

  // The app never holds a model key or the system prompt — it posts the
  // conversation + today's minimized metrics to our in-region backend, which
  // attaches the Saudi-context prompt and calls the model (Vertex Gemini).
  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;

    const history = msgs.map((m) => ({
      role: m.from === 'u' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));
    const userMsg: Msg = { id: idRef.current++, from: 'u', text: t };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    if (/walk|مشي/i.test(t)) toggleTask('walk');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    const backendUrl = (Constants.expoConfig?.extra?.backendUrl as string | undefined) ?? '';
    try {
      if (!backendUrl) throw new Error('الخادم غير مهيأ (أضف backendUrl في app.json)');
      const response = await fetch(`${backendUrl}/ai/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: t }],
          summary: s,
          water,
          locale: 'ar',
          isRamadan: ramadan,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.detail || data.error || `HTTP ${response.status}`);
      }
      setMsgs((m) => [...m, { id: idRef.current++, from: 'c', text: data.reply }]);
    } catch (error: any) {
      setMsgs((m) => [
        ...m,
        { id: idRef.current++, from: 'c', text: 'خطأ: ' + (error?.message ?? 'تعذّر الاتصال') },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <AppHeader />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.md,
              borderBottomWidth: 2,
              borderBottomColor: colors.border,
              marginTop: spacing.sm,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.accentDeep,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText style={{ fontSize: 20 }}>🫀</AppText>
            </View>
            <View>
              <AppText variant="title">مدربك الصحي</AppText>
              <AppText variant="caption" color={colors.accentText}>
                ● متصل · يعرف بياناتك اليوم
              </AppText>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
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
              <AppText
                variant="body"
                color={m.from === 'u' ? '#fff' : colors.ink}
                style={{ fontSize: 13 }}
              >
                {m.text}
              </AppText>
            </View>
          ))}
          {loading && (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.card,
                borderWidth: 2,
                borderColor: colors.border,
                borderRadius: radii.lg,
                borderBottomLeftRadius: 6,
                padding: spacing.md,
              }}
            >
              <ActivityIndicator color={colors.accent} size="small" />
            </View>
          )}
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
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              alignItems: 'center',
              paddingBottom: Math.max(spacing.md, insets.bottom),
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="اسأل مدربك..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={() => send(input)}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderWidth: 2,
                borderColor: colors.border,
                borderRadius: 99,
                paddingVertical: 13,
                paddingHorizontal: 17,
                fontSize: 13,
                color: colors.ink,
                textAlign: 'right',
              }}
            />
            <Pressable
              onPress={() => send(input)}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: loading ? colors.border : colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText color="#fff" style={{ fontSize: 17 }}>➤</AppText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
