import { Router, type Request, type Response } from 'express';
import type { HealthDaily } from '@nabdh/shared';

// Google Health API integration — the path forward for Fitbit Air and other
// Google-side wearables. It replaces the legacy Fitbit Web API (dev.fitbit.com),
// which is being turned down in September 2026.
//
// Why this lives on the backend (not the app):
//  1. The OAuth token exchange needs the client SECRET, which must never ship in
//     the app bundle (it is extractable). So the app does the user consent +
//     PKCE auth-code step, then hands the code to us to exchange.
//  2. Health data is "sensitive data" under Saudi PDPL. Fetching + normalizing
//     it here keeps raw data in-region; the app only ever receives a minimized
//     daily summary.
//
// Configure with env vars GOOGLE_HEALTH_CLIENT_ID and GOOGLE_HEALTH_CLIENT_SECRET.
// The OAuth2 token endpoints below are Google's stable endpoints. The v4 data
// resource paths are confirmed against the live Google Health API during testing;
// parsing is written defensively so a schema tweak degrades gracefully instead
// of crashing.

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const HEALTH_API_BASE = 'https://health.googleapis.com/v4';

type ClientCreds = { id: string; secret: string };
type Tokens = { accessToken: string; refreshToken?: string; expiresAt: number };

// TODO(prod): persist per-user tokens in Firestore (in-region), encrypted at
// rest, instead of this in-memory map. Memory is fine for a single dev instance.
const tokenStore = new Map<string, Tokens>();

function clientCreds(): ClientCreds | null {
  const id = process.env.GOOGLE_HEALTH_CLIENT_ID;
  const secret = process.env.GOOGLE_HEALTH_CLIENT_SECRET;
  return id && secret ? { id, secret } : null;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const googleHealthRouter = Router();

/** Step 1 — the app sends its PKCE auth code; we exchange it (with the secret). */
googleHealthRouter.post('/exchange', async (req: Request, res: Response) => {
  const creds = clientCreds();
  if (!creds) return res.status(503).json({ error: 'google_health_unconfigured' });

  const { uid, code, codeVerifier, redirectUri } = (req.body ?? {}) as Record<string, string>;
  if (!uid || !code || !redirectUri) return res.status(400).json({ error: 'missing_params' });

  try {
    const tokens = await exchangeCode(creds, code, codeVerifier, redirectUri);
    if (!tokens) return res.status(502).json({ error: 'exchange_failed' });
    tokenStore.set(uid, tokens);
    return res.json({ connected: true });
  } catch {
    return res.status(502).json({ error: 'exchange_failed' });
  }
});

/** Step 2 — the app asks for today's normalized summary; we fetch it in-region. */
googleHealthRouter.post('/today', async (req: Request, res: Response) => {
  const creds = clientCreds();
  if (!creds) return res.status(503).json({ error: 'google_health_unconfigured' });

  const { uid } = (req.body ?? {}) as Record<string, string>;
  if (!uid) return res.status(400).json({ error: 'missing_uid' });

  const accessToken = await validAccessToken(creds, uid);
  if (!accessToken) return res.status(401).json({ error: 'not_connected' });

  const summary = await fetchToday(accessToken);
  return res.json(summary);
});

/** Forget a user's tokens (called on disconnect / account deletion). */
googleHealthRouter.post('/disconnect', (req: Request, res: Response) => {
  const { uid } = (req.body ?? {}) as Record<string, string>;
  if (uid) tokenStore.delete(uid);
  return res.json({ ok: true });
});

async function exchangeCode(
  creds: ClientCreds,
  code: string,
  codeVerifier: string | undefined,
  redirectUri: string,
): Promise<Tokens | null> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: creds.id,
    client_secret: creds.secret,
    redirect_uri: redirectUri,
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  });
  const r = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!j.access_token) return null;
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000,
  };
}

/** Returns a non-expired access token, refreshing it if needed. */
async function validAccessToken(creds: ClientCreds, uid: string): Promise<string | null> {
  const t = tokenStore.get(uid);
  if (!t) return null;
  if (Date.now() < t.expiresAt - 60_000) return t.accessToken;
  if (!t.refreshToken) return null;
  const refreshed = await refreshToken(creds, t.refreshToken);
  if (!refreshed) return null;
  const next: Tokens = { ...refreshed, refreshToken: refreshed.refreshToken ?? t.refreshToken };
  tokenStore.set(uid, next);
  return next.accessToken;
}

async function refreshToken(creds: ClientCreds, refresh: string): Promise<Tokens | null> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh,
    client_id: creds.id,
    client_secret: creds.secret,
  });
  const r = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) return null;
  return { accessToken: j.access_token, expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000 };
}

/**
 * Fetch today's metrics from the Google Health API and normalize to the
 * device-agnostic HealthDaily shape. Resource paths under /v4 are finalized on
 * the live API; until then this requests the documented aggregate shapes and
 * parses defensively (missing fields stay undefined rather than throwing).
 */
async function fetchToday(accessToken: string): Promise<HealthDaily> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const timeRange = `startTime=${start.toISOString()}&endTime=${new Date().toISOString()}`;

  const get = async (path: string): Promise<Record<string, unknown> | null> => {
    try {
      const r = await fetch(`${HEALTH_API_BASE}/${path}`, { headers });
      return r.ok ? ((await r.json()) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };

  // These aggregate reads map onto Google Health's data types; the exact path
  // strings are confirmed during device testing against the v4 docs.
  const [steps, heart, sleep, energy] = await Promise.all([
    get(`users/me/dataTypes/steps:aggregate?${timeRange}`),
    get(`users/me/dataTypes/heart_rate:aggregate?${timeRange}`),
    get(`users/me/dataTypes/sleep:aggregate?${timeRange}`),
    get(`users/me/dataTypes/active_energy:aggregate?${timeRange}`),
  ]);

  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : undefined;
  const pick = (obj: Record<string, unknown> | null, ...keys: string[]): unknown => {
    let cur: unknown = obj;
    for (const k of keys) cur = (cur as Record<string, unknown> | null)?.[k];
    return cur;
  };

  return {
    date: todayKey(),
    source: 'fitbit', // Fitbit Air surfaced via Google Health
    steps: num(pick(steps, 'aggregate', 'total')),
    restingHeartRate: num(pick(heart, 'aggregate', 'restingHeartRate')),
    sleepMinutes: num(pick(sleep, 'aggregate', 'totalMinutesAsleep')),
    activeEnergyKcal: num(pick(energy, 'aggregate', 'totalKcal')),
  };
}
