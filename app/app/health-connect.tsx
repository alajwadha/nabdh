import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { useHealth } from '../src/store/health';
import { HC_DATA_TYPES, getStatus, readToday, requestPermissions, type HCStatus } from '../src/services/healthConnect';

export default function HealthConnect() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { setSummary } = useHealth();

  const [status, setStatus] = useState<HCStatus | 'loading'>('loading');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    getStatus().then(setStatus);
  }, []);

  const connect = async () => {
    setBusy(true);
    setNote(null);
    const res = await requestPermissions();
    if (res === 'granted') {
      const summary = await readToday();
      if (summary) {
        setSummary(summary);
        setStatus('connected');
        setNote('Connected, today’s data is now on your dashboard.');
      } else {
        setStatus('connected');
        setNote('Connected, but Health Connect has no data logged for today yet.');
      }
    } else if (res === 'denied') {
      setNote('Permission was declined. You can grant access in the Health Connect app.');
    } else {
      setNote('Health Connect isn’t available on this device.');
    }
    setBusy(false);
  };

  // Status → headline + body + accent tint.
  const card = (() => {
    switch (status) {
      case 'loading':
        return { tint: tiles.blue, title: 'Checking…', body: 'Looking for Health Connect on this device.' };
      case 'ios':
        return { tint: tiles.lav, title: 'Android only', body: 'Health Connect is Google’s health hub for Android. On iPhone, connect Apple Health instead.' };
      case 'unsupported':
        return { tint: tiles.gold, title: 'Needs a device build', body: 'Health Connect needs the full app build, so it can’t run in this preview.' };
      case 'not_installed':
        return { tint: tiles.gold, title: 'Health Connect not found', body: 'Install Health Connect from the Play Store, then come back to link your data.' };
      case 'ready':
        return { tint: tiles.mint, title: 'Ready to connect', body: 'Link Health Connect to pull steps, heart rate, sleep and more into Nabdh.' };
      case 'connected':
        return { tint: tiles.mint, title: 'Connected', body: 'Nabdh reads your latest day from Health Connect. Re-sync any time.' };
    }
  })();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Health Connect</AppText>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        Health Connect is Android’s shared health store. Linking it lets Nabdh read the data your other apps and watch already record, in one place, on your terms.
      </AppText>

      {/* status */}
      <Card style={{ gap: spacing.sm, backgroundColor: card.tint.bg, borderColor: card.tint.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name={status === 'connected' ? 'check' : status === 'ready' ? 'activity' : 'heart-pulse'} size={18} color={card.tint.ink} />
          <AppText variant="title" color={card.tint.ink}>{card.title}</AppText>
        </View>
        <AppText variant="caption" color={card.tint.ink} style={{ lineHeight: 18, opacity: 0.9 }}>{card.body}</AppText>
      </Card>

      {/* data types */}
      <Card style={{ gap: 0 }}>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: 6 }}>NABDH WILL READ</AppText>
        {HC_DATA_TYPES.map((d, i) => (
          <View key={d.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 11, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={d.icon} size={19} color={colors.textSecondary} />
            </View>
            <AppText variant="title" style={{ fontSize: 15, flex: 1 }}>{d.label}</AppText>
            <AppText variant="caption" color={colors.textMuted}>Read-only</AppText>
          </View>
        ))}
      </Card>

      {note && (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.navBg, borderRadius: radii.lg, padding: spacing.md }}>
          <Icon name="check" size={15} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>{note}</AppText>
        </View>
      )}

      {/* action */}
      {status === 'ready' && <Button label={busy ? 'Connecting…' : 'Connect Health Connect'} onPress={busy ? undefined : connect} />}
      {status === 'connected' && <Button label={busy ? 'Syncing…' : 'Re-sync today'} variant="line" onPress={busy ? undefined : connect} />}
      {status === 'not_installed' && (
        <Button label="Open Play Store" onPress={() => Linking.openURL('market://details?id=com.google.android.apps.healthdata').catch(() => Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'))} />
      )}

      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Nabdh only reads, it never writes to or shares your Health Connect data.
      </AppText>
    </Screen>
  );
}
