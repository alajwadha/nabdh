import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/design-system';
import { ThemeProvider, useTheme } from '../src/design-system/theme';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { HealthProvider } from '../src/store/health';
import { AppStateProvider } from '../src/store/app';
import { WorkoutProvider } from '../src/store/workouts';
import { HealthLogsProvider } from '../src/store/health-logs';
import { CycleProvider } from '../src/store/cycle';
import { MindfulProvider } from '../src/store/mindful';
import { SocialProvider } from '../src/store/social';
import { FastingProvider } from '../src/store/fasting';
import { initialHref, subscribe } from '../src/services/quickActions';
import { loadCachedPrayerTimes, refreshPrayerTimes } from '../src/data/prayer';
import '../src/i18n';

const AUTH_ROUTES = ['sign-in', 'phone'];

function useProtectedRoute() {
  const { user, loading, configError } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || configError) return;
    const inAuthArea = AUTH_ROUTES.includes(segments[0] as string);
    // Dev-only: skip the sign-in gate so the app lands on the dashboard with
    // demo data (no real auth needed). Production still requires sign-in.
    if (!user && !inAuthArea && !__DEV__) router.replace('/sign-in');
    else if (user && inAuthArea) router.replace('/');
  }, [user, loading, configError, segments]);
}

function RootNavigator() {
  const { loading } = useAuth();
  const { mode, colors: c } = useTheme();
  const router = useRouter();
  useProtectedRoute();

  // Route home-screen quick actions (long-press the app icon) to their deep links.
  useEffect(() => {
    const href = initialHref();
    if (href) router.navigate(href as never);
    return subscribe((h) => router.navigate(h as never));
  }, [router]);

  // Prayer times: show cached (location-based) values instantly, then refresh from the
  // device's current location. Falls back to the demo Riyadh times if location is denied.
  useEffect(() => {
    loadCachedPrayerTimes().finally(() => {
      refreshPrayerTimes();
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'fade',
        }}
      />
    </>
  );
}

export default function RootLayout() {
  // Plus Jakarta Sans for Latin, Tajawal for Arabic, AppText picks per script.
  const [fontsLoaded, fontError] = useFonts({
    'Jakarta-Medium': require('../assets/fonts/Jakarta-Medium.ttf'),
    'Jakarta-Bold': require('../assets/fonts/Jakarta-Bold.ttf'),
    'Jakarta-ExtraBold': require('../assets/fonts/Jakarta-ExtraBold.ttf'),
    'Tajawal-Regular': require('../assets/fonts/Tajawal-Regular.ttf'),
    'Tajawal-Medium': require('../assets/fonts/Tajawal-Medium.ttf'),
    'Tajawal-Bold': require('../assets/fonts/Tajawal-Bold.ttf'),
    'Tajawal-ExtraBold': require('../assets/fonts/Tajawal-ExtraBold.ttf'),
  });

  // Wait for fonts, but if loading FAILS, proceed anyway, RN falls back to the system
  // font (the prior behaviour) rather than hanging forever on the splash.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.accent} /></View>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <HealthProvider>
              <AppStateProvider>
                <WorkoutProvider>
                  <HealthLogsProvider>
                    <CycleProvider>
                      <MindfulProvider>
                        <SocialProvider>
                          <FastingProvider>
                            <RootNavigator />
                          </FastingProvider>
                        </SocialProvider>
                      </MindfulProvider>
                    </CycleProvider>
                  </HealthLogsProvider>
                </WorkoutProvider>
              </AppStateProvider>
            </HealthProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
