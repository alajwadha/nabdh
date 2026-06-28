import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
import { initialHref, subscribe } from '../src/services/quickActions';
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
                          <RootNavigator />
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
