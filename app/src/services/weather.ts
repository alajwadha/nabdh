// Live weather from Open-Meteo (free, no API key). Network is best-effort: any failure
// returns null and the UI shows an honest offline state — we never invent a temperature.

export type WeatherNow = { tempC: number; feelsC: number; humidity: number; code: number };
export type WeatherHour = { iso: string; hour: number; tempC: number; feelsC: number };
// nowHour is the CURRENT hour in the forecast's own timezone (not the device's) so it can
// be compared against `hours[].hour` without a tz mismatch for non-local users.
export type Forecast = { place: string; now: WeatherNow; nowHour: number; hours: WeatherHour[] };

export const RIYADH = { lat: 24.7136, lon: 46.6753, name: 'Riyadh' };

export async function getForecast(
  lat: number = RIYADH.lat,
  lon: number = RIYADH.lon,
  place: string = RIYADH.name,
): Promise<Forecast | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code` +
      `&hourly=temperature_2m,apparent_temperature&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j: any = await res.json();
    const c = j?.current;
    const h = j?.hourly;
    // Bail to null (honest offline state) rather than render NaN if the shape is off.
    if (!c || typeof c.temperature_2m !== 'number') return null;
    if (!Array.isArray(h?.time) || !Array.isArray(h?.temperature_2m)) return null;
    const now: WeatherNow = {
      tempC: Math.round(c.temperature_2m),
      feelsC: Math.round(c.apparent_temperature ?? c.temperature_2m),
      humidity: Math.round(c.relative_humidity_2m ?? 0),
      code: c.weather_code ?? 0,
    };
    const hours: WeatherHour[] = (h.time as string[]).map((iso, i) => ({
      iso,
      hour: Number(iso.slice(11, 13)),
      tempC: Math.round(h.temperature_2m[i]),
      feelsC: Math.round(h.apparent_temperature?.[i] ?? h.temperature_2m[i]),
    }));
    if (!Number.isFinite(now.feelsC) || !Number.isFinite(now.tempC) || hours.some((x) => !Number.isFinite(x.feelsC) || !Number.isFinite(x.hour))) {
      return null;
    }
    // Current hour in the forecast's timezone (Open-Meteo returns current.time as a local ISO).
    const nowHour = typeof c.time === 'string' ? Number(c.time.slice(11, 13)) : new Date().getHours();
    return { place, now, nowHour, hours };
  } catch {
    return null;
  }
}
