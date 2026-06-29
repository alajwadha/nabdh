// Pure geo math for the GPS tracker, no native imports, fully unit-testable.
// Coordinates come from expo-location (see services/location.ts).

// t = epoch ms; seg groups points into continuous segments (a pause starts a new seg so
// the gap isn't counted as distance); acc = horizontal accuracy in metres, if known.
export type GeoPoint = { lat: number; lon: number; alt?: number; t: number; seg?: number; acc?: number };

const R = 6371000; // earth radius, metres
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance between two points, in metres. */
export function haversine(a: GeoPoint, b: GeoPoint): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Total route length in kilometres. Pairs that straddle a pause (different seg) are
 * skipped so the straight line across a break never inflates the distance. */
export function routeDistanceKm(pts: GeoPoint[]): number {
  let m = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].seg !== pts[i - 1].seg) continue;
    m += haversine(pts[i - 1], pts[i]);
  }
  return m / 1000;
}

/** Cumulative positive altitude change, in metres (0 when no altitude data). */
export function elevationGainM(pts: GeoPoint[]): number {
  let g = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1].alt;
    const b = pts[i].alt;
    if (a != null && b != null && b > a) g += b - a;
  }
  return Math.round(g);
}

/** Seconds per kilometre (0 when distance is 0, caller formats as “-”). */
export function paceSecPerKm(km: number, secs: number): number {
  return km > 0 ? secs / km : 0;
}

/** Pace over the last `windowSec` seconds of the track, the “current pace”. */
export function recentPaceSecPerKm(pts: GeoPoint[], windowSec = 25): number {
  if (pts.length < 2) return 0;
  const last = pts[pts.length - 1].t;
  const recent = pts.filter((p) => last - p.t <= windowSec * 1000);
  if (recent.length < 2) return 0;
  const secs = (recent[recent.length - 1].t - recent[0].t) / 1000;
  return paceSecPerKm(routeDistanceKm(recent), secs);
}

export function speedKmh(km: number, secs: number): number {
  return secs > 0 ? km / (secs / 3600) : 0;
}

/** "m:ss" pace, or "-" when undefined/non-finite. */
export function fmtPace(secPerKm: number): string {
  if (!secPerKm || !isFinite(secPerKm)) return '-';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "m:ss" under an hour, "h:mm:ss" beyond. */
export function fmtClock(secs: number): string {
  const t = Math.max(0, Math.floor(secs));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export type Pt2 = { x: number; y: number };

/** Project lat/lon onto a w×h box (north up, aspect-preserving, centred) for drawing.
 * A single point lands in the centre; an empty list returns []. */
export function normalize(pts: GeoPoint[], w: number, h: number, pad = 14): Pt2[] {
  if (pts.length === 0) return [];
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const lonMin = Math.min(...lons);
  const lonMax = Math.max(...lons);
  const cos = Math.cos(rad((latMin + latMax) / 2)); // longitude shrinks toward the poles
  const spanX = Math.max(1e-9, (lonMax - lonMin) * cos);
  const spanY = Math.max(1e-9, latMax - latMin);
  const iw = w - 2 * pad;
  const ih = h - 2 * pad;
  const scale = Math.min(iw / spanX, ih / spanY);
  const offX = pad + (iw - spanX * scale) / 2;
  const offY = pad + (ih - spanY * scale) / 2;
  return pts.map((p) => ({
    x: offX + (p.lon - lonMin) * cos * scale,
    y: offY + (latMax - p.lat) * scale, // invert so north is up
  }));
}
