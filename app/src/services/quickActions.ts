// Home-screen app-icon quick actions (long-press the icon) via expo-quick-actions.
// Lazy-required like services/location.ts so it's a clean no-op where the module is
// absent (Expo Go without the plugin, web, this sandbox). Each action carries a deep-link
// href that app/_layout.tsx routes to when the action is picked.

import type { IconName } from '../components/Icon';

let QA: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  QA = require('expo-quick-actions');
} catch {
  QA = null;
}
const API = QA?.default ?? QA;

export type ShortcutAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName; // in-app line icon
  href: string; // expo-router path to open
  // native SF Symbol / Android resource hints (used only on a real build if present)
  iosIcon?: string;
};

export const ACTIONS: ShortcutAction[] = [
  { id: 'water', title: 'Add water', subtitle: '+1 glass (250 ml)', icon: 'droplet', href: '/(tabs)/food?quickWater=1', iosIcon: 'symbol:drop.fill' },
  { id: 'food', title: 'Add food', subtitle: 'Search dishes or scan', icon: 'utensils', href: '/food-search', iosIcon: 'symbol:fork.knife' },
  { id: 'workout', title: 'Start workout', subtitle: 'Log gym or a sport', icon: 'dumbbell', href: '/workout', iosIcon: 'symbol:dumbbell.fill' },
  { id: 'breathe', title: 'Breathe', subtitle: 'A calm minute', icon: 'wind', href: '/breathe', iosIcon: 'symbol:wind' },
  { id: 'track', title: 'Track outdoors', subtitle: 'GPS run / walk / ride', icon: 'map-pin', href: '/track', iosIcon: 'symbol:location.fill' },
];

/** True if the native quick-actions module is actually present. */
export function quickActionsAvailable(): boolean {
  return !!API;
}

/** Register (or refresh) the home-screen quick actions. Returns whether it took effect. */
export async function enableShortcuts(): Promise<boolean> {
  if (!API?.setItems) return false;
  try {
    await API.setItems(
      ACTIONS.map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: a.subtitle,
        icon: a.iosIcon,
        params: { href: a.href },
      })),
    );
    return true;
  } catch {
    return false;
  }
}

/** Remove all registered quick actions. */
export async function clearShortcuts(): Promise<void> {
  if (!API?.setItems) return;
  try {
    await API.setItems([]);
  } catch {
    /* no-op */
  }
}

/** The href of a quick action the app was cold-launched from, if any. */
export function initialHref(): string | null {
  const item = API?.initial;
  return (item?.params?.href as string) ?? null;
}

/** Subscribe to quick-action selections while the app is running. Returns an unsubscribe fn. */
export function subscribe(onHref: (href: string) => void): () => void {
  if (!API?.addListener) return () => {};
  try {
    const sub = API.addListener((item: any) => {
      const href = item?.params?.href;
      if (typeof href === 'string') onHref(href);
    });
    return () => {
      try {
        sub?.remove?.();
      } catch {
        /* no-op */
      }
    };
  } catch {
    return () => {};
  }
}
