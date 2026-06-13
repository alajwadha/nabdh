import { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import type { HealthDaily } from '@nabdh/shared';

// Fitbit Air (and other Google-side wearables) via the Google Health API.
// This replaces the legacy Fitbit Web API path (turned down Sept 2026).
//
// The app only does the user-facing consent + PKCE auth-code step. The auth code
// is handed to OUR in-region backend, which exchanges it with the client secret,
// stores/refreshes the tokens, fetches the data, and returns a minimized daily
// summary. Raw health data never touches the device on this path, and the secret
// never ships in the bundle.

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  // Token exchange happens on the backend, not here.
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

// Confirm the exact Google Health API scope strings against the v4 docs at setup.
const SCOPES = ['openid', 'https://www.googleapis.com/auth/health.read'];

export const googleHealthRedirectUri = AuthSession.makeRedirectUri({
  scheme: 'nabdh',
  path: 'google-health',
});

function config(): { clientId?: string; backendUrl?: string } {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const gh = (extra.googleHealth ?? {}) as { clientId?: string };
  const backendUrl = typeof extra.backendUrl === 'string' ? extra.backendUrl : undefined;
  const clientId = gh.clientId && gh.clientId.length > 0 ? gh.clientId : undefined;
  return { clientId, backendUrl };
}

async function postJson(url: string, body: unknown): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.ok ? ((await r.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Hook: returns connectGoogleHealth() to start the OAuth flow. */
export function useGoogleHealthConnect(
  uid: string | undefined,
  onSummary: (summary: HealthDaily) => void,
) {
  const { clientId, backendUrl } = config();
  const configured = !!clientId && !!backendUrl;

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId ?? 'unconfigured',
      scopes: SCOPES,
      redirectUri: googleHealthRedirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
      // access_type=offline + prompt=consent so the backend receives a refresh token.
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    discovery,
  );

  useEffect(() => {
    const run = async () => {
      if (response?.type !== 'success' || !request?.codeVerifier || !uid || !backendUrl) return;
      const code = response.params.code;
      const exchanged = await postJson(`${backendUrl}/google-health/exchange`, {
        uid,
        code,
        codeVerifier: request.codeVerifier,
        redirectUri: googleHealthRedirectUri,
      });
      if (!exchanged?.connected) return;
      const summary = await postJson(`${backendUrl}/google-health/today`, { uid });
      if (summary && typeof summary.date === 'string') onSummary(summary as unknown as HealthDaily);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    connectGoogleHealth: () => promptAsync(),
    configured,
  };
}

/** Re-fetch today's summary for an already-connected user (on dashboard mount). */
export async function fetchGoogleHealthToday(uid: string): Promise<HealthDaily | null> {
  const { backendUrl } = config();
  if (!backendUrl) return null;
  const summary = await postJson(`${backendUrl}/google-health/today`, { uid });
  return summary && typeof summary.date === 'string' ? (summary as unknown as HealthDaily) : null;
}

/** Disconnect / forget tokens on the backend (account deletion, sign-out). */
export async function disconnectGoogleHealth(uid: string): Promise<void> {
  const { backendUrl } = config();
  if (!backendUrl) return;
  await postJson(`${backendUrl}/google-health/disconnect`, { uid });
}
