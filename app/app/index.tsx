import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { HealthDaily } from '@nabdh/shared';
import { Screen, Card, AppText, Button } from '../src/design-system/components';
import { ReadinessHero, MetricTile, TileGrid } from '../src/components/Dashboard';
import { colors, spacing } from '../src/design-system';
import { useAuth } from '../src/auth/AuthProvider';
import { useHealth } from '../src/store/health';
import { MedicalDisclaimer } from '../src/components/MedicalDisclaimer';
import { isAvailable, readTodaySummary, requestHealthKitPermissions } from '../src/integrations/healthkit';
import { useGoogleHealthConnect, fetchGoogleHealthToday } from '../src/integrations/googleHealth';
import { DEMO_SUMMARY } from '../src/integrations/demo';

/**
 * Transparent readiness heuristic (placeholder for the in-region insight engine):
 * weighted blend of sleep, resting HR, and HRV, each scored against a simple
 * target band. Returns null until at least one input is available.
 */
function computeReadiness(s: HealthDaily | null): number | null {
  if (!s) return null;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  let score = 0;
  let weight = 0;
  if (s.sleepMinutes != null) {
    score += clamp(s.sleepMinutes / 450) * 40;
    weight += 40;
  }
  if (s.restingHeartRate != null) {
    score += clamp((70 - s.restingHeartRate) / 16) * 30; // lower RHR is better
    weight += 30;
  }
  if (s.hrvSdnn != null) {
    score += clamp(s.hrvSdnn / 70) * 30;
    weight += 30;
  }
  if (weight === 0) return null;
  return Math.round((score / weight) * 100);
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { summary, source, setSummary } = useHealth();
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const uid = user?.uid;

  const { connectGoogleHealth, configured: googleConfigured } = useGoogleHealthConnect(uid, (fresh) => {
    setSummary(fresh);
    setIsDemo(false);
  });

  useEffect(() => {
    isAvailable().then(setAppleAvailable);
    (async () => {
      if (uid) {
        const fresh = await fetchGoogleHealthToday(uid);
        if (fresh) {
          setSummary(fresh);
          setIsDemo(false);
          return;
        }
      }
      // Dev-only: sample data so the dashboard is not empty before a device connects.
      if (__DEV__) {
        setSummary(DEMO_SUMMARY);
        setIsDemo(true);
      }
    })();
  }, [uid]);

  const syncApple = async () => {
    setBusy('apple');
    try {
      const granted = await requestHealthKitPermissions();
      if (granted) {
        const fresh = await readTodaySummary();
        setSummary(fresh);
        setIsDemo(false);
      }
    } finally {
      setBusy(null);
    }
  };

  const onGoogle = () => {
    if (!googleConfigured) return;
    setBusy('google');
    connectGoogleHealth().finally(() => setBusy(null));
  };

  // Finish onboarding first (skipped in dev so the dashboard is easy to preview).
  if (!__DEV__ && user && profile && !profile.onboardedAt) {
    return <Redirect href="/onboarding" />;
  }

  const readiness = computeReadiness(summary);
  const sleepHours =
    summary?.sleepMinutes != null ? Math.round((summary.sleepMinutes / 60) * 10) / 10 : undefined;

  const connectedLabel =
    source === 'fitbit' ? t('device.fitbit') : source === 'healthkit' ? t('device.appleHealth') : null;
  const badgeColor = isDemo ? colors.warning : connectedLabel ? colors.accent : colors.textMuted;
  const badgeText = isDemo
    ? t('device.demoBadge')
    : connectedLabel
      ? t('device.connectedTo', { name: connectedLabel })
      : t('device.none');

  const primaryConnect = appleAvailable && Platform.OS === 'ios' ? syncApple : onGoogle;

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="display">{t('app.name')}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {t('home.greeting')}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: badgeColor }} />
        <AppText variant="caption" color={badgeColor}>
          {badgeText}
        </AppText>
      </View>

      <ReadinessHero
        score={readiness}
        label={t('readiness.label')}
        caption={t('readiness.caption')}
        emptyText={t('readiness.noData')}
        connectLabel={t('device.connectTitle')}
        onConnect={primaryConnect}
      />

      <TileGrid>
        <MetricTile
          label={t('metric.restingHr')}
          value={summary?.restingHeartRate}
          unit={t('unit.bpm')}
          color="peach"
        />
        <MetricTile label={t('metric.hrv')} value={summary?.hrvSdnn} unit={t('unit.ms')} color="lav" />
        <MetricTile label={t('metric.sleep')} value={sleepHours} unit={t('unit.hours')} color="mint" />
        <MetricTile
          label={t('metric.steps')}
          value={summary?.steps != null ? summary.steps.toLocaleString() : undefined}
          color="pink"
        />
        <MetricTile
          label={t('metric.energy')}
          value={summary?.activeEnergyKcal}
          unit={t('unit.kcal')}
          color="gold"
        />
        <MetricTile
          label={t('metric.spo2')}
          value={summary?.spo2}
          unit={t('unit.percent')}
          color="blue"
        />
      </TileGrid>

      <Card>
        <AppText variant="title">{t('device.connectTitle')}</AppText>
        {Platform.OS === 'ios' && appleAvailable && (
          <Button
            label={busy === 'apple' ? t('home.syncing') : t('device.connectApple')}
            onPress={syncApple}
          />
        )}
        <Button
          label={busy === 'google' ? t('home.syncing') : t('device.connectGoogle')}
          onPress={onGoogle}
        />
        {!googleConfigured && (
          <AppText variant="caption" color={colors.textMuted}>
            {t('device.googleSetup')}
          </AppText>
        )}
      </Card>

      <MedicalDisclaimer />
    </Screen>
  );
}
