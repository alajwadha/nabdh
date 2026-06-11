import { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type { HealthDaily } from '@nabdh/shared';
import { todayKey } from '../../services/health';

// Fitbit Web API OAuth 2.0 (PKCE / public "Client" app) + daily data fetch.
// This is the TESTING path: the app talks to Fitbit directly with the user's own
// token. For production + PDPL, this moves behind the in-region backend (Phase 2),
// and we target the Google Health API. Register a "Client" app at dev.fitbit.com,
// set the callback to the redirect below, and put the Client ID in app.json.

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
  tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
  revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke',
};

const SCOPES = ['activity', 'heartrate', 'sleep', 'profile'];
const TOKEN_KEY = 'fitbit_access_token';

export const fitbitRedirectUri = AuthSession.makeRedirectUri({ scheme: 'nabdh', path: 'fitbit' });

function clientId(): string | undefined {
  const id = (Constants.expoConfig?.extra?.fitbit as { clientId?: string } | undefined)?.clientId;
  return id && id.length > 0 ? id : undefined;
}

export async function getStoredFitbitToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearFitbitToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Hook: returns connectFitbit() to start the OAuth flow. Calls onSummary on success. */
export function useFitbitConnect(onSummary: (summary: HealthDaily) => void) {
  const cid = clientId();
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: cid ?? 'unconfigured',
      scopes: SCOPES,
      redirectUri: fitbitRedirectUri,
      usePKCE: true,
    },
    discovery,
  );

  useEffect(() => {
    const run = async () => {
      if (response?.type !== 'success' || !request?.codeVerifier || !cid) return;
      const code = response.params.code;
      const token = await exchangeToken(cid, code, request.codeVerifier);
      if (!token) return;
      await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
      const summary = await fetchFitbitToday(token);
      if (summary) onSummary(summary);
    };
    run();
  }, [response]);

  return {
    connectFitbit: () => promptAsync(),
    ready: !!request && !!cid,
    configured: !!cid,
  };
}

async function exchangeToken(
  cid: string,
  code: string,
  codeVerifier: string,
): Promise<string | null> {
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: cid,
      code_verifier: codeVerifier,
      redirect_uri: fitbitRedirectUri,
    }).toString();
    const res = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = await res.json();
    return (json?.access_token as string) ?? null;
  } catch {
    return null;
  }
}

/** Fetch today's steps, resting HR, and sleep from the Fitbit Web API. */
export async function fetchFitbitToday(token: string): Promise<HealthDaily | null> {
  const headers = { Authorization: `Bearer ${token}` };
  const get = async (url: string): Promise<any | null> => {
    try {
      const r = await fetch(url, { headers });
      return r.ok ? await r.json() : null;
    } catch {
      return null;
    }
  };

  const [activity, heart, sleep] = await Promise.all([
    get('https://api.fitbit.com/1/user/-/activities/date/today.json'),
    get('https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json'),
    get('https://api.fitbit.com/1.2/user/-/sleep/date/today.json'),
  ]);

  const totalDistance = activity?.summary?.distances?.find?.(
    (d: any) => d.activity === 'total',
  )?.distance;

  return {
    date: todayKey(),
    source: 'fitbit',
    steps: activity?.summary?.steps,
    distanceKm: typeof totalDistance === 'number' ? totalDistance : undefined,
    restingHeartRate: heart?.['activities-heart']?.[0]?.value?.restingHeartRate,
    sleepMinutes: sleep?.summary?.totalMinutesAsleep,
    activeEnergyKcal: activity?.summary?.activityCalories,
  };
}
