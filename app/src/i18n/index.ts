import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

// Arabic-first. RTL languages we mirror layout for.
const RTL_LANGS = ['ar', 'he', 'fa', 'ur'];
const SUPPORTED = ['ar', 'en'] as const;
export type AppLang = (typeof SUPPORTED)[number];

export function isRTLLang(lng: string): boolean {
  return RTL_LANGS.includes(lng);
}

const deviceLang = getLocales()[0]?.languageCode ?? 'ar';
const initialLang: AppLang = (SUPPORTED as readonly string[]).includes(deviceLang)
  ? (deviceLang as AppLang)
  : 'ar';

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});

/**
 * Switch language. Text updates live; layout direction (RTL/LTR) only flips
 * after a full reload, so call Updates.reloadAsync() after this in production
 * (wired in Phase 0 once expo-updates is added).
 */
export function setAppLanguage(lng: AppLang): boolean {
  i18n.changeLanguage(lng);
  const shouldBeRTL = isRTLLang(lng);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return true; // caller should reload to apply the direction change
  }
  return false;
}

export default i18n;
