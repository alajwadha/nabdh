// Shared types used by both the app and the backend.

export type ConfidenceLevel = 'high' | 'med' | 'low';

export type DishCategory =
  | 'rice_grain'
  | 'meat_poultry'
  | 'bread_breakfast_dairy'
  | 'seafood'
  | 'veg_legume_soup'
  | 'street_food'
  | 'sweets_drinks';

export interface Dish {
  id: string;
  nameEn: string;
  nameAr: string;
  category: DishCategory;
  /** Typical serving weight in grams (or use servingLabel for pieces/cups). */
  servingGrams?: number;
  servingLabel?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: ConfidenceLevel;
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** One normalized day of wearable data (device-agnostic). */
export interface HealthDaily {
  date: string; // YYYY-MM-DD
  source: 'healthkit' | 'fitbit' | 'merged';
  steps?: number;
  distanceKm?: number;
  restingHeartRate?: number;
  hrvSdnn?: number;
  spo2?: number;
  sleepMinutes?: number;
  activeEnergyKcal?: number;
  basalEnergyKcal?: number;
}

export type MealItemSource = 'dish_db' | 'fatsecret' | 'openfoodfacts' | 'usda' | 'manual';

export interface MealItem {
  name: string;
  quantityGrams?: number;
  macros: Macros;
  source: MealItemSource;
  confidence: ConfidenceLevel;
}

export interface Meal {
  id: string;
  loggedAt: string;
  items: MealItem[];
  total: Macros;
}

export type AiProvider = 'vertex-gemini' | 'gemini' | 'claude' | 'openai';

export type ConsentType = 'pdpl_processing' | 'healthkit' | 'ai_cross_border';

export interface ConsentRecord {
  type: ConsentType;
  granted: boolean;
  version: string;
  timestamp: string;
}

export interface CoachMemory {
  goals: string[];
  patterns: string[];
  pastAdvice: { at: string; note: string }[];
}

export type Units = 'metric' | 'imperial';

export type GoalType =
  | 'lose_weight'
  | 'build_muscle'
  | 'improve_sleep'
  | 'more_active'
  | 'maintain';

export const GOAL_TYPES: GoalType[] = [
  'lose_weight',
  'build_muscle',
  'improve_sleep',
  'more_active',
  'maintain',
];

export interface UserProfile {
  uid: string;
  displayName?: string;
  locale: 'ar' | 'en';
  units: Units;
  goals: GoalType[];
  createdAt: string;
  onboardedAt?: string;
}

export const CONSENT_VERSION = '2026-06-06';
export const CONSENT_TYPES: ConsentType[] = ['pdpl_processing', 'healthkit', 'ai_cross_border'];
