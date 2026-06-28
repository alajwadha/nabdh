import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Screen, Sheet, Toggle } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { useAuth } from '../src/auth/AuthProvider';
import { useAppState } from '../src/store/app';
import { useIdentity } from '../src/data/identity';
import { useHealth } from '../src/store/health';
import { useFitbitConnect, fitbitRedirectUri } from '../src/integrations/fitbit';
import { Icon, type IconName } from '../src/components/Icon';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 0 }}>
      <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: spacing.sm, marginLeft: 4 }}>
        {title}
      </AppText>
      <View style={{ backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: spacing.lg }}>
        {children}
      </View>
    </View>
  );
}

function Row({ icon, label, right, onPress, last }: { icon: IconName; label: string; right?: React.ReactNode; onPress?: () => void; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14, borderBottomWidth: last ? 0 : 2, borderBottomColor: colors.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={colors.textSecondary} />
      </View>
      <AppText variant="title" style={{ flex: 1 }}>
        {label}
      </AppText>
      {right}
    </Pressable>
  );
}

const PERMS: Record<'apple' | 'fitbit', { name: string; rows: [IconName, string][] }> = {
  apple: { name: 'Apple Health', rows: [['footprints', 'Steps & distance'], ['heart', 'Heart rate & resting HR'], ['activity', 'Heart rate variability'], ['moon', 'Sleep analysis'], ['heart-pulse', 'Blood oxygen'], ['flame', 'Active energy']] },
  fitbit: { name: 'Fitbit Air', rows: [['footprints', 'Activity & steps'], ['heart', 'Heart rate'], ['moon', 'Sleep stages'], ['flame', 'Calories']] },
};

export default function Profile() {
  const { colors, tiles, mode, toggle } = useTheme();
  const { signOut } = useAuth();
  const { ramadan, setRamadan, showPrayers, setShowPrayers, body } = useAppState();
  const identity = useIdentity();
  const { setSummary } = useHealth();
  const router = useRouter();
  const [model, setModel] = useState<'managed' | 'claude' | 'gpt'>('managed');
  const [connect, setConnect] = useState<'apple' | 'fitbit' | null>(null);
  const [fitbitConnected, setFitbitConnected] = useState(false);

  // Real Fitbit OAuth (PKCE). On success the daily summary flows into the
  // health store and the dashboard switches from demo to live data.
  const fitbit = useFitbitConnect((summary) => {
    setSummary(summary);
    setFitbitConnected(true);
  });

  const startFitbit = () => {
    if (!fitbit.configured) {
      Alert.alert(
        'Fitbit not configured',
        `Add your Fitbit OAuth Client ID to app.json (expo.extra.fitbit.clientId), then register this callback at dev.fitbit.com:\n\n${fitbitRedirectUri}`,
      );
      return;
    }
    setConnect(null);
    fitbit.connectFitbit();
  };

  const fam: [string, string, number, string][] = [
    ['You', identity.initial, 0.84, '#2E7D5B'],
    ['Mama', 'M', 0.96, '#C2562C'],
    ['Faisal', 'F', 0.61, '#4A3F9E'],
  ];
  const badges: [IconName, string, boolean][] = [
    ['flame', '12-day food streak', true],
    ['moon', '7 nights on time', true],
    ['footprints', '100k steps week', true],
    ['trophy', '30-day streak', false],
  ];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Profile</AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.accentDeep, borderRadius: radii.xl, padding: spacing.lg }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: 22, fontWeight: '800', color: '#5A4410' }}>{identity.initial}</AppText>
        </View>
        <View>
          <AppText variant="h2" color="#fff">{identity.fullName}</AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.9)" style={{ fontWeight: '600' }}>
            Goal · {identity.goal}
          </AppText>
        </View>
      </View>

      <Group title="YOUR DAY">
        <Row icon="sliders-horizontal" label="Customize Today" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/(tabs)')} />
        <Row icon="scale" label="Vitals & meds" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate("/vitals")} />
        {body.sex === 'female' && <Row icon="calendar" label="Cycle" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate("/cycle")} />}
        <Row icon="heart-pulse" label="Body & metrics" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/body')} />
        <Row icon="bell" label="Reminders" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/reminders')} />
        <Row icon="wind" label="Breathe" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate("/breathe")} />
        <Row icon="timer" label="Fasting timer" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate("/fasting")} />
        <Row icon="users" label="Friends & challenges" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate("/social")} />
        <Row icon="dumbbell" label="Workout programs" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/programs')} />
        <Row icon="map-pin" label="Track outdoors (GPS)" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/track')} />
        <Row icon="thermometer" label="Heat & training" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/heat')} />
        <Row icon="sunrise" label="Your day (prayer plan)" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/day-plan')} />
        <Row icon="heart-pulse" label="Heart-rate zones" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/hr-zones')} />
        <Row icon="zap" label="Shortcuts & voice" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/shortcuts')} />
        <Row icon="moon-star" label="Ramadan mode" right={<Toggle on={ramadan} />} onPress={() => setRamadan(!ramadan)} />
        <Row icon="church" label="Prayer-time strip" right={<Toggle on={showPrayers} />} onPress={() => setShowPrayers(!showPrayers)} />
        <Row icon={mode === 'dark' ? 'sun-medium' : 'moon'} label="Dark mode" right={<Toggle on={mode === 'dark'} />} onPress={toggle} last />
      </Group>

      <Group title="CONNECTED DEVICES">
        <Row icon="watch" label="Apple Health" right={<Status text="Synced" colors={colors} />} onPress={() => setConnect('apple')} />
        <Row icon="zap" label="Fitbit Air · Google Health" right={fitbitConnected ? <Status text="Synced" colors={colors} /> : <AppText variant="caption" color={colors.accentText}>Connect ›</AppText>} onPress={() => setConnect('fitbit')} />
        <Row icon="activity" label="Health Connect" right={<AppText variant="caption" color={colors.accentText}>Connect ›</AppText>} onPress={() => router.navigate('/health-connect')} last />
      </Group>

      <Group title="AI COACH MODEL">
        {([['managed', 'Nabdh managed', 'Gemini · processed in-Kingdom', 'DEFAULT'], ['claude', 'Bring your own — Claude', 'Premium · cross-border, opt-in', 'PRO'], ['gpt', 'Bring your own — GPT', 'Premium · cross-border, opt-in', 'PRO']] as const).map(([key, name, sub, tag], i) => (
          <Pressable key={key} onPress={() => setModel(key)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 13, borderBottomWidth: i === 2 ? 0 : 2, borderBottomColor: colors.border }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: model === key ? colors.accent : colors.border, alignItems: 'center', justifyContent: 'center' }}>
              {model === key && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title">{name}</AppText>
              <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '500' }}>{sub}</AppText>
            </View>
            <View style={{ backgroundColor: tag === 'DEFAULT' ? tiles.mint.bg : tiles.gold.bg, borderRadius: 99, paddingVertical: 4, paddingHorizontal: 9 }}>
              <AppText variant="caption" color={tag === 'DEFAULT' ? tiles.mint.ink : tiles.gold.ink} style={{ fontSize: 9 }}>{tag}</AppText>
            </View>
          </Pressable>
        ))}
      </Group>

      <Group title="PRIVACY & DATA">
        <View style={{ backgroundColor: tiles.mint.bg, borderRadius: 14, padding: 13, marginVertical: 10, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="shield" size={16} color={tiles.mint.ink} />
          <AppText variant="caption" color={tiles.mint.ink} style={{ fontWeight: '600', lineHeight: 18, flex: 1 }}>
            Your health data is processed and stored in the Kingdom (Dammam · me-central2). It never leaves the region unless you opt in to a Pro model.
          </AppText>
        </View>
        <Row icon="download" label="Export my data" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} onPress={() => router.navigate('/export')} />
        <Row icon="trash-2" label="Delete everything" right={<AppText variant="caption" color={colors.textMuted}>›</AppText>} last />
      </Group>

      <Group title="FAMILY · RAMADAN STEP CHALLENGE">
        {fam.map(([name, av, w, c], i) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: colors.border }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}>
              <AppText color="#fff" style={{ fontWeight: '800', fontSize: 13 }}>{av}</AppText>
            </View>
            <AppText variant="title" style={{ width: 64 }}>{name}</AppText>
            <View style={{ flex: 1, height: 8, borderRadius: 99, backgroundColor: colors.navBg, overflow: 'hidden' }}>
              <View style={{ width: `${w * 100}%`, height: '100%', borderRadius: 99, backgroundColor: colors.accent }} />
            </View>
            <AppText variant="caption" style={{ width: 52, textAlign: 'right' }}>{[8432, 9610, 6120][i].toLocaleString()}</AppText>
          </View>
        ))}
        <Row icon="plus" label="Invite family" right={<AppText variant="caption" color={colors.accentText}>Share ›</AppText>} last />
      </Group>

      <Group title="ACHIEVEMENTS">
        <View style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md }}>
          {badges.map(([icon, label, earned]) => (
            <View key={label} style={{ width: 70, alignItems: 'center', opacity: earned ? 1 : 0.4 }}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: earned ? tiles.gold.bg : colors.navBg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <Icon name={icon} size={24} color={earned ? tiles.gold.ink : colors.textMuted} />
              </View>
              <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 9.5, textAlign: 'center', lineHeight: 12 }}>{label}</AppText>
            </View>
          ))}
        </View>
      </Group>

      <Button label="Sign out" variant="line" onPress={() => { signOut(); router.replace('/sign-in'); }} />

      <Sheet visible={connect != null} onClose={() => setConnect(null)}>
        {connect && (
          <View style={{ gap: spacing.md }}>
            <AppText variant="h2">Connect {PERMS[connect].name}</AppText>
            <AppText variant="caption" color={colors.textMuted}>Choose what Nabdh can read. You can change this anytime.</AppText>
            <View style={{ backgroundColor: tiles.mint.bg, borderRadius: 14, padding: 13, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="shield" size={16} color={tiles.mint.ink} />
              <AppText variant="caption" color={tiles.mint.ink} style={{ fontWeight: '600', lineHeight: 18, flex: 1 }}>
                Data is processed and stored in-Kingdom (Dammam · me-central2). Raw samples stay on your device.
              </AppText>
            </View>
            {PERMS[connect].rows.map(([icon, label]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: colors.border }}>
                <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icon} size={17} color={colors.textSecondary} />
                </View>
                <AppText variant="title" style={{ flex: 1 }}>{label}</AppText>
                <Toggle on />
              </View>
            ))}
            <Button
              label={connect === 'fitbit' ? 'Connect Fitbit' : 'Allow & connect'}
              onPress={() => {
                if (connect === 'fitbit') startFitbit();
                else setConnect(null);
              }}
            />
          </View>
        )}
      </Sheet>
    </Screen>
  );
}


function Status({ text, colors }: { text: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentText }} />
      <AppText variant="caption" color={colors.accentText}>{text}</AppText>
    </View>
  );
}
