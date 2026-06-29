// A curated reference table of common Saudi/Gulf dishes with per-serving macros. These are
// reasonable cookbook/label estimates for a typical home serving, a real reference DB, not
// fabricated personal data. Numbers are approximate; portions vary.
import type { TileColor } from '../design-system';

export type DishCat = 'main' | 'breakfast' | 'bread' | 'side' | 'sweet' | 'drink';
export type Dish = {
  id: string;
  name: string;
  ar: string;
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  cat: DishCat;
  color: TileColor;
};

export const DISHES: Dish[] = [
  { id: 'kabsa', name: 'Kabsa with chicken', ar: 'كبسة دجاج', serving: '1 plate', kcal: 640, protein: 38, carbs: 62, fat: 24, cat: 'main', color: 'pink' },
  { id: 'mandi', name: 'Lamb mandi', ar: 'مندي لحم', serving: '1 plate', kcal: 700, protein: 42, carbs: 58, fat: 32, cat: 'main', color: 'pink' },
  { id: 'saleeg', name: 'Saleeg', ar: 'سليق', serving: '1 bowl', kcal: 420, protein: 20, carbs: 55, fat: 12, cat: 'main', color: 'mint' },
  { id: 'jareesh', name: 'Jareesh', ar: 'جريش', serving: '1 bowl', kcal: 280, protein: 12, carbs: 45, fat: 6, cat: 'main', color: 'mint' },
  { id: 'harees', name: 'Harees', ar: 'هريس', serving: '1 bowl', kcal: 310, protein: 18, carbs: 38, fat: 9, cat: 'main', color: 'mint' },
  { id: 'margoog', name: 'Margoog', ar: 'مرقوق', serving: '1 bowl', kcal: 340, protein: 16, carbs: 45, fat: 10, cat: 'main', color: 'mint' },
  { id: 'gursan', name: 'Gursan', ar: 'قرصان', serving: '1 bowl', kcal: 360, protein: 15, carbs: 50, fat: 11, cat: 'main', color: 'mint' },
  { id: 'madhroba', name: 'Madhroba', ar: 'مظروبة', serving: '1 bowl', kcal: 330, protein: 16, carbs: 42, fat: 10, cat: 'main', color: 'mint' },
  { id: 'shawarma', name: 'Chicken shawarma', ar: 'شاورما دجاج', serving: '1 wrap', kcal: 480, protein: 30, carbs: 42, fat: 22, cat: 'main', color: 'peach' },
  { id: 'mutabbaq', name: 'Mutabbaq', ar: 'مطبق', serving: '1 piece', kcal: 320, protein: 10, carbs: 30, fat: 18, cat: 'main', color: 'peach' },
  { id: 'sambousek', name: 'Sambousek', ar: 'سمبوسك', serving: '3 pieces', kcal: 270, protein: 9, carbs: 28, fat: 14, cat: 'side', color: 'gold' },
  { id: 'falafel', name: 'Falafel', ar: 'فلافل', serving: '4 pieces', kcal: 230, protein: 8, carbs: 24, fat: 12, cat: 'side', color: 'gold' },
  { id: 'hummus', name: 'Hummus', ar: 'حمص', serving: '100 g', kcal: 180, protein: 7, carbs: 20, fat: 9, cat: 'side', color: 'gold' },
  { id: 'tabbouleh', name: 'Tabbouleh', ar: 'تبولة', serving: '1 bowl', kcal: 120, protein: 3, carbs: 18, fat: 5, cat: 'side', color: 'mint' },
  { id: 'foul', name: 'Foul medames', ar: 'فول مدمس', serving: '1 bowl', kcal: 220, protein: 12, carbs: 30, fat: 6, cat: 'breakfast', color: 'mint' },
  { id: 'shakshuka', name: 'Shakshuka', ar: 'شكشوكة', serving: '1 pan', kcal: 250, protein: 14, carbs: 12, fat: 16, cat: 'breakfast', color: 'pink' },
  { id: 'masoub', name: 'Masoub', ar: 'معصوب', serving: '1 bowl', kcal: 450, protein: 8, carbs: 70, fat: 15, cat: 'breakfast', color: 'gold' },
  { id: 'balaleet', name: 'Balaleet', ar: 'بلاليط', serving: '1 plate', kcal: 380, protein: 12, carbs: 55, fat: 12, cat: 'breakfast', color: 'gold' },
  { id: 'areeka', name: 'Areeka', ar: 'عريكة', serving: '1 plate', kcal: 420, protein: 7, carbs: 62, fat: 16, cat: 'breakfast', color: 'gold' },
  { id: 'tameez', name: 'Tameez bread', ar: 'تميس', serving: '1 piece', kcal: 280, protein: 9, carbs: 54, fat: 4, cat: 'bread', color: 'peach' },
  { id: 'khubz', name: 'Khubz (pita)', ar: 'خبز', serving: '1 loaf', kcal: 165, protein: 5, carbs: 33, fat: 1, cat: 'bread', color: 'peach' },
  { id: 'tamr', name: 'Dates', ar: 'تمر', serving: '3 dates', kcal: 200, protein: 2, carbs: 50, fat: 0, cat: 'sweet', color: 'peach' },
  { id: 'kunafa', name: 'Kunafa', ar: 'كنافة', serving: '1 piece', kcal: 380, protein: 7, carbs: 45, fat: 19, cat: 'sweet', color: 'pink' },
  { id: 'luqaimat', name: 'Luqaimat', ar: 'لقيمات', serving: '5 pieces', kcal: 300, protein: 4, carbs: 45, fat: 12, cat: 'sweet', color: 'gold' },
  { id: 'qahwa', name: 'Arabic coffee', ar: 'قهوة عربية', serving: '1 cup', kcal: 5, protein: 0, carbs: 1, fat: 0, cat: 'drink', color: 'gold' },
  { id: 'karak', name: 'Karak tea', ar: 'كرك', serving: '1 cup', kcal: 120, protein: 3, carbs: 18, fat: 4, cat: 'drink', color: 'peach' },
  { id: 'laban', name: 'Laban / ayran', ar: 'لبن', serving: '1 cup', kcal: 90, protein: 5, carbs: 8, fat: 4, cat: 'drink', color: 'blue' },
];

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[ً-ٟ]/g, '');

/** Substring search over English + Arabic names; empty query returns all. */
export function searchDishes(q: string): Dish[] {
  const t = norm(q.trim());
  if (!t) return DISHES;
  return DISHES.filter((d) => norm(d.name).includes(t) || norm(d.ar).includes(t) || d.cat.includes(t));
}

export function dishById(id: string): Dish | undefined {
  return DISHES.find((d) => d.id === id);
}

export const CAT_LABEL: Record<DishCat, string> = {
  main: 'Mains',
  breakfast: 'Breakfast',
  bread: 'Bread',
  side: 'Sides',
  sweet: 'Sweets',
  drink: 'Drinks',
};
