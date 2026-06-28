import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { useAppState } from '../src/store/app';
import { getForecast, type Forecast } from '../src/services/weather';
import { bestWindow, extraGlasses, heatLevel, hourLabel } from '../src/data/heat';
import { prayerTime } from '../src/data/prayer';
import { sweatLossLiters } from '../src/data/workouts';

export default function Heat() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { body } = useAppState();

  const [status, setStatus] = useState<'loading' | 'ok' | 'offline'>('loading');
  const [forecast, setForecast] = useState<Forecast | null>(null);

  const load = async () => {
    setStatus('loading');
    const f = await getForecast();
    setForecast(f);
    setStatus(f ? 'ok' : 'offline');
  };
  useEffect(() => {
    load();
  }, []);

  const asrHour = Number(prayerTime('asr').slice(0, 2));
  const level = forecast ? heatLevel(forecast.now.feelsC) : null;
  // Use the forecast's own current-hour (its timezone), not the device clock — otherwise a
  // non-Riyadh device would pick the wrong outdoor window.
  const win = forecast ? bestWindow(forecast.hours, forecast.nowHour, asrHour) : null;
  const glasses = extraGlasses(sweatLossLiters(9.8, 45, body.weightKg, true) - sweatLossLiters(9.8, 45, body.weightKg, false));

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Heat & training</AppText>
      </View>

      {status === 'loading' && (
        <AppText variant="caption" color={colors.textMuted}>Checking today’s conditions…</AppText>
      )}

      {status === 'offline' && (
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="thermometer" size={18} color={colors.textSecondary} />
            <AppText variant="title">Weather unavailable</AppText>
          </View>
          <AppText variant="caption" color={colors.textMuted} style={{ lineHeight: 18 }}>
            Couldn’t reach the weather service. In Gulf summer, training before Fajr or well after Asr is almost always the cooler, safer call.
          </AppText>
          <Button label="Try again" variant="line" onPress={load} />
        </Card>
      )}

      {status === 'ok' && forecast && level && (
        <>
          {/* current conditions */}
          <Card style={{ alignItems: 'center', gap: 2, paddingVertical: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="sun-medium" size={18} color={level.color} />
              <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>{forecast.place.toUpperCase()} · FEELS LIKE</AppText>
            </View>
            <AppText variant="metric" style={{ fontSize: 60, lineHeight: 64 }} color={colors.ink}>{forecast.now.feelsC}°</AppText>
            <AppText variant="caption" color={colors.textMuted}>Air {forecast.now.tempC}° · {forecast.now.humidity}% humidity</AppText>
          </Card>

          {/* heat-risk level */}
          <Card style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4 }}>HEAT RISK</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: level.color }} />
                <AppText variant="title" style={{ fontSize: 15 }} color={colors.ink}>{level.label}</AppText>
              </View>
            </View>
            <AppText variant="caption" color={colors.textSecondary} style={{ lineHeight: 18 }}>{level.advice}</AppText>
          </Card>

          {/* best outdoor window */}
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: tiles.mint.bg, borderColor: tiles.mint.bg }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="wind" size={22} color={tiles.mint.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={tiles.mint.ink} style={{ letterSpacing: 1.2, opacity: 0.8 }}>BEST WINDOW TO TRAIN OUTSIDE</AppText>
              {win ? (
                <>
                  <AppText variant="title" color={tiles.mint.ink}>{hourLabel(win.startHour)} – {hourLabel(win.endHour)} · feels {win.feelsC}°</AppText>
                  {win.afterAsr && <AppText variant="caption" color={tiles.mint.ink} style={{ opacity: 0.9 }}>After Asr, as it cools off.</AppText>}
                </>
              ) : (
                <AppText variant="title" color={tiles.mint.ink}>Tomorrow morning — today’s daylight is done.</AppText>
              )}
            </View>
          </Card>

          {/* hydration nudge */}
          {level.key !== 'low' && (
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tiles.blue.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="droplets" size={22} color={tiles.blue.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title">Add ~{glasses} glasses</AppText>
                <AppText variant="caption" color={colors.textMuted}>Extra water around a 45-min outdoor session in this heat.</AppText>
              </View>
            </Card>
          )}

          <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
            Live weather for {forecast.place} (demo location). Hydration is an estimate from your body weight and effort.
          </AppText>
        </>
      )}
    </Screen>
  );
}
