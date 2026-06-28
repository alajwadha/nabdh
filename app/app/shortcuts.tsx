import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, Button, Card, Screen, Toggle } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { ACTIONS, clearShortcuts, enableShortcuts, quickActionsAvailable } from '../src/services/quickActions';

const KEY = 'nabdh.shortcuts.enabled';
const SCHEME = 'nabdh:/'; // deep-link scheme prefix for the Siri / Assistant URLs

export default function Shortcuts() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const available = quickActionsAvailable();

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      const on = v === '1';
      setEnabled(on);
      // OS quick actions don't persist across cold launches — re-register if the
      // user had them on, so the toggle state matches reality.
      if (on && available) enableShortcuts();
    });
  }, [available]);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    AsyncStorage.setItem(KEY, next ? '1' : '0').catch(() => {});
    if (next) await enableShortcuts();
    else await clearShortcuts();
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Shortcuts</AppText>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        Jump straight into the things you do most — from your home screen or by voice.
      </AppText>

      {/* enable home-screen quick actions */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: tiles.mint.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="zap" size={20} color={tiles.mint.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title">Home-screen actions</AppText>
            <AppText variant="caption" color={colors.textMuted}>Long-press the Nabdh icon for these</AppText>
          </View>
          <Pressable onPress={toggle} disabled={!available} hitSlop={8} style={{ opacity: available ? 1 : 0.4 }}>
            <Toggle on={enabled && available} />
          </Pressable>
        </View>
        {!available && (
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
            Home-screen actions need the full app build — they won’t register in this preview.
          </AppText>
        )}
      </Card>

      {/* the actions */}
      <Card style={{ gap: 0 }}>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: 6 }}>QUICK ACTIONS</AppText>
        {ACTIONS.map((a, i) => (
          <Pressable
            key={a.id}
            onPress={() => router.navigate(a.href as never)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 11, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={a.icon} size={19} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title" style={{ fontSize: 15 }}>{a.title}</AppText>
              <AppText variant="caption" color={colors.textMuted}>{a.subtitle}</AppText>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </Card>

      {/* voice / Siri / Assistant */}
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="message-circle" size={18} color={colors.accentText} />
          <AppText variant="title">Voice · Siri & Assistant</AppText>
        </View>
        <AppText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>
          Add any of these links to the Siri Shortcuts app (iOS) or Google Assistant routines (Android) to open Nabdh by voice — e.g. “Hey Siri, log my water.”
        </AppText>
        {ACTIONS.map((a) => (
          <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
            <AppText variant="caption" color={colors.ink}>{a.title}</AppText>
            <View style={{ backgroundColor: colors.navBg, borderRadius: radii.sm, paddingVertical: 4, paddingHorizontal: 8 }}>
              <AppText variant="caption" color={colors.textSecondary} style={{ fontVariant: ['tabular-nums'] }}>{SCHEME}{a.href}</AppText>
            </View>
          </View>
        ))}
      </Card>

      {/* honest widget note */}
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.navBg, borderRadius: radii.lg, padding: spacing.md }}>
        <Icon name="sliders-horizontal" size={16} color={colors.textSecondary} />
        <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1, lineHeight: 18 }}>
          Home-screen widgets (today’s rings & streaks at a glance) need a native widget extension — they’re on the roadmap, not in this build yet.
        </AppText>
      </View>

      {available && enabled && <Button label="Refresh home-screen actions" variant="line" onPress={enableShortcuts} />}
    </Screen>
  );
}
