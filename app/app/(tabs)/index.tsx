import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { HealthDaily } from '@nabdh/shared';
import { AppText, Card, Screen, SectionHeader, Sheet } from '../../src/design-system/components';
import { AppHeader } from '../../src/components/AppHeader';
import { InsightHero } from '../../src/components/InsightHero';
import {
  AddTile,
  CoachCard,
  EnergyMini,
  MetricTile,
  PlanList,
  PrayerStrip,
  TileGrid,
} from '../../src/components/Dashboard';
import { MetricDetailBody } from '../../src/components/MetricDetail';
import { radii, spacing } from '../../src/design-system';
import { useTheme } from '../../src/design-system/theme';
import { useAuth } from '../../src/auth/AuthProvider';
import { useHealth } from '../../src/store/health';
import { useAppState, type MetricKey } from '../../src/store/app';
import { ALL_METRICS, METRICS, METRIC_ICON } from '../../src/data/metrics';
import { useIdentity } from '../../src/data/identity';
import { fetchGoogleHealthToday } from '../../src/integrations/googleHealth';
import { isAvailable } from '../../src/integrations/healthkit';

function computeReadiness(s: HealthDaily | null): number | null {
  if (!s) return null;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  let score = 0;
  let weight = 0;
  if (s.sleepMinutes != null) { score += clamp(s.sleepMinutes / 450) * 40; weight += 40; }
  if (s.restingHeartRate != null) { score += clamp((70 - s.restingHeartRate) / 16) * 30; weight += 30; }
  if (s.hrvSdnn != null) { score += clamp(s.hrvSdnn / 70) * 30; weight += 30; }
  return weight === 0 ? null : Math.round((score / weight) * 100);
}

export default function Today() {
  const { t } = useTranslation();
  const { colors, tiles: tilePalette } = useTheme();
  const { user, profile } = useAuth();
  const identity = useIdentity();
  const { summary, setSummary } = useHealth();
  const { tiles, toggleTile, removeTile, showPrayers, setShowPrayers, ramadan, plan, toggleTask } = useAppState();
  const router = useRouter();
  const uid = user?.uid;

  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailKey, setDetailKey] = useState<MetricKey | 'readiness' | null>(null);

  useEffect(() => {
    isAvailable();
    (async () => {
      // Real data (when signed in) takes over; otherwise the HealthProvider's
      // demo seed (dev) or a linked device summary already populates the store.
      if (uid) {
        const fresh = await fetchGoogleHealthToday(uid);
        if (fresh) setSummary(fresh);
      }
    })();
  }, [uid]);

  if (!__DEV__ && user && profile && !profile.onboardedAt) {
    return <Redirect href="/onboarding" />;
  }

  const readiness = computeReadiness(summary) ?? 64;
  const tileValue = (k: MetricKey) => {
    const def = METRICS[k];
    const v = def.read?.(summary);
    return v != null ? v : def.sample;
  };

  const onHero = (key: string) => {
    if (key === 'readiness') setDetailKey('readiness');
    else if (key === 'hrv') setDetailKey('hrv');
    else if (key === 'trends') router.navigate('/trends');
    else if (key === 'saudi') setDetailKey('steps');
    else if (key === 'plan') router.navigate('/(tabs)/coach');
  };

  return (
    <Screen>
      <AppHeader />

      <AppText variant="display" style={{ marginTop: spacing.xs }}>
        {ramadan ? t('home.greetRamadan') : t('home.greetCalm')}{' '}
        <AppText variant="display" color={colors.accentText}>
          {identity.firstName}
        </AppText>
      </AppText>

      {ramadan && (
        <View style={{ backgroundColor: '#5A3E8E', borderRadius: radii.xl, padding: spacing.lg }}>
          <AppText variant="caption" color="rgba(255,255,255,0.8)" style={{ letterSpacing: 2 }}>
            FASTING · DAY 12
          </AppText>
          <AppText style={{ fontSize: 36, fontWeight: '800', color: '#fff', marginVertical: 2 }}>5:31</AppText>
          <AppText variant="caption" color="#fff" style={{ fontWeight: '500' }}>
            until Maghrib (iftar) · 6:42 PM. Break gently with dates & laban.
          </AppText>
        </View>
      )}

      <InsightHero readiness={readiness} onOpen={onHero} />

      {(showPrayers || ramadan) && <PrayerStrip highlight={ramadan ? 'maghrib' : 'asr'} />}

      <SectionHeader
        title={t('home.yourMetrics')}
        action={
          <Pressable onPress={() => setEditing((e) => !e)}>
            <AppText variant="caption" color={colors.accentText}>
              {editing ? t('home.done') : t('home.customize')}
            </AppText>
          </Pressable>
        }
      />

      <TileGrid>
        {tiles.map((k) => (
          <MetricTile
            key={k}
            label={METRICS[k].label}
            value={tileValue(k)}
            unit={METRICS[k].unit}
            hint={METRICS[k].hint}
            color={METRICS[k].color}
            editing={editing}
            onRemove={() => removeTile(k)}
            onPress={() => (k === 'sleep' ? router.navigate('/(tabs)/sleep') : k === 'water' ? router.navigate('/(tabs)/food') : setDetailKey(k))}
          />
        ))}
        {editing && <AddTile onPress={() => setAddOpen(true)} />}
      </TileGrid>

      <EnergyMini onPress={() => setDetailKey('cals')} />

      <PlanList items={plan} onToggle={toggleTask} labelFor={(k) => t(k)} anchorFor={(k) => t(k)} />

      <CoachCard>{t('home.coachToday')}</CoachCard>

      {/* metric detail */}
      <Sheet visible={detailKey != null} onClose={() => setDetailKey(null)}>
        {detailKey && <MetricDetailBody metricKey={detailKey} />}
      </Sheet>

      {/* add-metric */}
      <Sheet visible={addOpen} onClose={() => setAddOpen(false)}>
        <AppText variant="h2">{t('home.addTitle')}</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
          {t('home.addSub')}
        </AppText>
        <Pressable
          onPress={() => setShowPrayers(!showPrayers)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: colors.border }}
        >
          <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: tilePalette.mint.bg, alignItems: 'center', justifyContent: 'center' }}>
            <AppText style={{ fontSize: 16 }}>🕌</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{t('home.prayerStrip')}</AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '500' }}>
              Riyadh · prayer-anchored plan
            </AppText>
          </View>
          <Toggle on={showPrayers} />
        </Pressable>
        {ALL_METRICS.map((k) => (
          <Pressable
            key={k}
            onPress={() => toggleTile(k)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: colors.border }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: tilePalette[METRICS[k].color].bg, alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ fontSize: 16 }}>{METRIC_ICON[k]}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title">{METRICS[k].label}</AppText>
              <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '500' }}>
                {tileValue(k)} {METRICS[k].unit ?? ''}
              </AppText>
            </View>
            <Toggle on={tiles.includes(k)} />
          </Pressable>
        ))}
      </Sheet>
    </Screen>
  );
}

function Toggle({ on }: { on: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: 46, height: 27, borderRadius: 99, backgroundColor: on ? colors.accent : colors.border, justifyContent: 'center' }}>
      <View style={{ width: 21, height: 21, borderRadius: 99, backgroundColor: '#fff', marginLeft: on ? 22 : 3 }} />
    </View>
  );
}
