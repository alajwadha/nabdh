import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TileColor } from '../design-system';
import { bmr, calorieBudget, hydrationGlasses, macroTargets, resolveActivityFactor, tdee, type Goal } from '../data/health-metrics';

export type MetricKey =
  | 'rhr'
  | 'hrv'
  | 'sleep'
  | 'steps'
  | 'stress'
  | 'spo2'
  | 'resp'
  | 'cals'
  | 'water'
  | 'vo2'
  | 'resil';

export type PlanTask = {
  key: string;
  labelKey: string;
  anchor?: string;
  time: string;
  done: boolean;
};

export type Meal = {
  id: string;
  name: string;
  meta: string;
  kcal: number;
  color: TileColor;
  protein: number;
  carbs: number;
  fat: number;
};

export type Macros = { protein: number; carbs: number; fat: number };

export type Sex = 'male' | 'female';
export type Body = {
  age: number;
  heightCm: number;
  weightKg: number;
  sex: Sex;
  activity: string; // ActivityLevel key (see health-metrics)
  goal: Goal;
};
export const DEFAULT_BODY: Body = { age: 30, heightCm: 175, weightKg: 80, sex: 'male', activity: 'moderate', goal: 'maintain' };

const DEFAULT_TILES: MetricKey[] = ['rhr', 'hrv', 'sleep', 'steps'];

const DEFAULT_PLAN: PlanTask[] = [
  { key: 'lunch', labelKey: 'plan.lunch', time: '1:42', done: true },
  { key: 'walk', labelKey: 'plan.walk', anchor: 'plan.afterAsr', time: '3:40', done: false },
  { key: 'dinner', labelKey: 'plan.dinner', anchor: 'plan.postMaghrib', time: '7:10', done: false },
  { key: 'sleep', labelKey: 'plan.lights', time: '11:15', done: false },
];

const DEFAULT_MEALS: Meal[] = [
  { id: 'm1', name: 'Dates & laban', meta: '7:12 AM · photo', kcal: 310, color: 'peach', protein: 8, carbs: 58, fat: 4 },
  { id: 'm2', name: 'Arabic coffee ×2', meta: '9:40 AM · quick add', kcal: 12, color: 'gold', protein: 0, carbs: 2, fat: 0 },
  { id: 'm3', name: 'Kabsa with chicken', meta: '1:42 PM · photo · 38g protein', kcal: 642, color: 'pink', protein: 38, carbs: 62, fat: 24 },
  { id: 'm4', name: 'Karak tea', meta: '4:05 PM · quick add', kcal: 120, color: 'peach', protein: 3, carbs: 18, fat: 4 },
];

type AppState = {
  tiles: MetricKey[];
  setTiles: (next: MetricKey[]) => void;
  toggleTile: (k: MetricKey) => void;
  removeTile: (k: MetricKey) => void;

  showPrayers: boolean;
  setShowPrayers: (v: boolean) => void;

  ramadan: boolean;
  setRamadan: (v: boolean) => void;

  plan: PlanTask[];
  toggleTask: (key: string) => void;

  water: number;
  waterGoal: number;
  addWater: () => void;

  meals: Meal[];
  addMeal: (m: Meal) => void;
  kcal: number;
  macros: Macros;
  macroGoals: Macros;
  budget: number;

  body: Body;
  setBody: (patch: Partial<Body>) => void;
};

const Ctx = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [tiles, setTilesState] = useState<MetricKey[]>(DEFAULT_TILES);
  const [showPrayers, setShowPrayersState] = useState(false);
  const [ramadan, setRamadanState] = useState(false);
  const [plan, setPlan] = useState<PlanTask[]>(DEFAULT_PLAN);
  const [water, setWater] = useState(3);
  const [meals, setMeals] = useState<Meal[]>(DEFAULT_MEALS);
  const [body, setBodyState] = useState<Body>(DEFAULT_BODY);
  // Saudi-first: scale hydration by activity and assume Gulf heat by default.
  const waterGoal = hydrationGlasses(body.weightKg, resolveActivityFactor(body.activity), true);

  useEffect(() => {
    AsyncStorage.multiGet(['nabdh.tiles', 'nabdh.prayers', 'nabdh.body']).then((pairs) => {
      for (const [k, v] of pairs) {
        if (k === 'nabdh.tiles' && v) {
          try {
            const arr = JSON.parse(v) as MetricKey[];
            if (Array.isArray(arr) && arr.length) setTilesState(arr);
          } catch {
            /* ignore */
          }
        }
        if (k === 'nabdh.prayers' && v) setShowPrayersState(v === '1');
        if (k === 'nabdh.body' && v) {
          try {
            setBodyState({ ...DEFAULT_BODY, ...(JSON.parse(v) as Partial<Body>) });
          } catch {
            /* ignore */
          }
        }
      }
    });
  }, []);

  const setBody = (patch: Partial<Body>) => {
    setBodyState((b) => {
      const next = { ...b, ...patch };
      AsyncStorage.setItem('nabdh.body', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const setTiles = (next: MetricKey[]) => {
    setTilesState(next);
    AsyncStorage.setItem('nabdh.tiles', JSON.stringify(next)).catch(() => {});
  };
  const toggleTile = (k: MetricKey) =>
    setTiles(tiles.includes(k) ? tiles.filter((x) => x !== k) : [...tiles, k]);
  const removeTile = (k: MetricKey) => setTiles(tiles.filter((x) => x !== k));

  const setShowPrayers = (v: boolean) => {
    setShowPrayersState(v);
    AsyncStorage.setItem('nabdh.prayers', v ? '1' : '0').catch(() => {});
  };

  const toggleTask = (key: string) =>
    setPlan((p) => p.map((t) => (t.key === key ? { ...t, done: !t.done } : t)));

  const addWater = () => setWater((w) => Math.min(waterGoal, w + 1));

  const addMeal = (m: Meal) => setMeals((arr) => [...arr, m]);

  // Calorie budget derives from the body profile (BMR → TDEE → goal, safe-floored)
  // so Body and Food agree instead of showing two contradictory numbers.
  const bmrVal = bmr(body.weightKg, body.heightCm, body.age, body.sex);
  const budget = calorieBudget(tdee(bmrVal, resolveActivityFactor(body.activity)), body.goal, body.sex);
  const macroGoals: Macros = macroTargets(body.weightKg, budget, body.goal);

  const kcal = meals.reduce((sum, m) => sum + m.kcal, 0);
  const macros: Macros = meals.reduce(
    (acc, m) => ({ protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { protein: 0, carbs: 0, fat: 0 },
  );

  const value: AppState = {
    tiles,
    setTiles,
    toggleTile,
    removeTile,
    showPrayers,
    setShowPrayers,
    ramadan,
    setRamadan: setRamadanState,
    plan,
    toggleTask,
    water,
    waterGoal,
    addWater,
    meals,
    addMeal,
    kcal,
    macros,
    macroGoals,
    budget,
    body,
    setBody,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
