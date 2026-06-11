import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Card, AppText, Button } from '../src/design-system/components';
import { AnimatedCounter } from '../src/animations/AnimatedCounter';
import { colors, spacing } from '../src/design-system';
import { useAuth } from '../src/auth/AuthProvider';
import { useHealth } from '../src/store/health';
import { MedicalDisclaimer } from '../src/components/MedicalDisclaimer';
import { isAvailable, readTodaySummary, requestHealthKitPermissions } from '../src/integrations/healthkit';
import { useFitbitConnect, getStoredFitbitToken, fetchFitbitToday } from '../src/integrations/fitbit';
import { DEMO_SUMMARY } from '../src/integrations/demo';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { summary, source, setSummary } = useHealth();
  const [busy, setBusy] = useState<'fitbit' | 'apple' | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const { connectFitbit, configured: fitbitConfigured } = useFitbitConnect((fresh) => {
    setSummary(fresh);
    setIsDemo(false);
  });

  useEffect(() => {
    isAvailable().then(setAppleAvailable);
    getStoredFitbitToken().then(async (token) => {
      if (token) {
        const fresh = await fetchFitbitToday(token);
        if (fresh) {
          setSummary(fresh);
          setIsDemo(false);
          return;
        }
      }
      // Dev-only: show sample data so the dashboard is not empty before a device connects.
      if (__DEV__) {
        setSummary(DEMO_SUMMARY);
        setIsDemo(true);
      }
    });
  }, []);

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

  const onFitbit = () => {
    if (!fitbitConfigured) return;
    setBusy('fitbit');
    connectFitbit().finally(() => setBusy(null));
  };

  // Finish onboarding first (skipped in dev so the dashboard is easy to preview).
  if (!__DEV__ && user && profile && !profile.onboardedAt) {
    return <Redirect href="/onboarding" />;
  }

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

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="h1">{t('app.name')}</AppText>
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

      <Card>
        <AppText variant="caption" color={colors.textMuted}>
          {t('home.steps')}
        </AppText>
        <AnimatedCounter value={summary?.steps ?? 0} />
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Stat label={t('metric.restingHr')} value={summary?.restingHeartRate} unit={t('unit.bpm')} />
        <Stat label={t('metric.sleep')} value={sleepHours} unit={t('unit.hours')} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Stat label={t('metric.hrv')} value={summary?.hrvSdnn} unit={t('unit.ms')} />
        <Stat label={t('metric.energy')} value={summary?.activeEnergyKcal} unit={t('unit.kcal')} />
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <AppText variant="title">{t('device.connectTitle')}</AppText>
        <Button label={busy === 'fitbit' ? t('home.syncing') : t('device.connectFitbit')} onPress={onFitbit} />
        {Platform.OS === 'ios' && appleAvailable && (
          <Button label={busy === 'apple' ? t('home.syncing') : t('device.connectApple')} onPress={syncApple} />
        )}
        {!fitbitConfigured && (
          <AppText variant="caption" color={colors.textMuted}>
            {t('device.fitbitSetup')}
          </AppText>
        )}
      </View>

      <MedicalDisclaimer />
    </Screen>
  );
}

function Stat({ label, value, unit }: { label: string; value?: number; unit: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
        <AppText variant="h2">{value != null ? String(value) : '--'}</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: 4 }}>
          {unit}
        </AppText>
      </View>
    </Card>
  );
}
