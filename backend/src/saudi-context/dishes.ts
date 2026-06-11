import type { Dish } from '@nabdh/shared';

// Curated Saudi/Gulf dish DB: the local-first layer of the nutrition engine
// and part of the moat. Macros are per typical serving. The full ~96-dish
// catalog (with confidence flags) lives in the plan's Appendix A and is ported
// here incrementally. Per-100g is the source of truth where available; servings
// are deliberate house assumptions and are editable in-app.
export const DISHES: Dish[] = [
  // Rice & grain mains
  { id: 'kabsa-meat', nameEn: 'Kabsa, meat', nameAr: 'كبسة لحم', category: 'rice_grain', servingGrams: 350, kcal: 480, protein: 25, carbs: 54, fat: 17, confidence: 'high' },
  { id: 'kabsa-chicken', nameEn: 'Kabsa, chicken', nameAr: 'كبسة دجاج', category: 'rice_grain', servingGrams: 350, kcal: 380, protein: 19, carbs: 51, fat: 12, confidence: 'med' },
  { id: 'mandi-lamb', nameEn: 'Mandi, lamb', nameAr: 'مندي لحم', category: 'rice_grain', servingGrams: 350, kcal: 365, protein: 19, carbs: 39, fat: 14, confidence: 'high' },
  { id: 'mandi-chicken', nameEn: 'Mandi, chicken', nameAr: 'مندي دجاج', category: 'rice_grain', servingGrams: 350, kcal: 430, protein: 22, carbs: 50, fat: 14, confidence: 'med' },
  { id: 'machboos', nameEn: 'Machboos', nameAr: 'مجبوس', category: 'rice_grain', servingGrams: 350, kcal: 570, protein: 34, carbs: 54, fat: 23, confidence: 'med' },
  { id: 'saleeg', nameEn: 'Saleeg', nameAr: 'سليق', category: 'rice_grain', servingGrams: 350, kcal: 390, protein: 23, carbs: 39, fat: 15, confidence: 'high' },
  { id: 'jareesh', nameEn: 'Jareesh', nameAr: 'جريش', category: 'rice_grain', servingGrams: 300, kcal: 360, protein: 15, carbs: 47, fat: 12, confidence: 'high' },
  { id: 'margoog', nameEn: 'Margoog', nameAr: 'مرقوق', category: 'rice_grain', servingGrams: 300, kcal: 270, protein: 12, carbs: 33, fat: 11, confidence: 'high' },
  { id: 'harees', nameEn: 'Harees', nameAr: 'هريس', category: 'rice_grain', servingGrams: 250, kcal: 250, protein: 18, carbs: 38, fat: 9, confidence: 'med' },

  // Meat & poultry
  { id: 'mansaf', nameEn: 'Mansaf', nameAr: 'منسف', category: 'meat_poultry', servingGrams: 350, kcal: 840, protein: 43, carbs: 57, fat: 46, confidence: 'high' },
  { id: 'madfoon', nameEn: 'Madfoon', nameAr: 'مدفون', category: 'meat_poultry', servingGrams: 350, kcal: 480, protein: 26, carbs: 56, fat: 17, confidence: 'med' },
  { id: 'shawarma-sandwich-chicken', nameEn: 'Shawarma sandwich, chicken', nameAr: 'شاورما دجاج', category: 'meat_poultry', servingGrams: 250, servingLabel: '1 wrap', kcal: 480, protein: 30, carbs: 48, fat: 18, confidence: 'med' },
  { id: 'shish-tawook', nameEn: 'Shish tawook', nameAr: 'شيش طاووق', category: 'meat_poultry', servingGrams: 200, servingLabel: '2 skewers', kcal: 330, protein: 40, carbs: 6, fat: 16, confidence: 'high' },

  // Seafood
  { id: 'sayadiyah', nameEn: 'Sayadiyah, fish & rice', nameAr: 'صيادية', category: 'seafood', servingGrams: 300, kcal: 520, protein: 28, carbs: 80, fat: 8, confidence: 'high' },
  { id: 'grilled-hamour', nameEn: 'Grilled Hamour', nameAr: 'هامور مشوي', category: 'seafood', servingGrams: 200, servingLabel: '1 fillet', kcal: 240, protein: 51, carbs: 0, fat: 3, confidence: 'high' },
  { id: 'shrimp-machboos', nameEn: 'Shrimp Machboos', nameAr: 'مكبوس روبيان', category: 'seafood', servingGrams: 300, kcal: 560, protein: 38, carbs: 70, fat: 16, confidence: 'med' },

  // Bread, breakfast & dairy
  { id: 'tameez', nameEn: 'Tameez/Tamees bread', nameAr: 'تميس', category: 'bread_breakfast_dairy', servingGrams: 95, servingLabel: '1 piece', kcal: 240, protein: 8, carbs: 48, fat: 2, confidence: 'med' },
  { id: 'masoub', nameEn: 'Masoub', nameAr: 'معصوب', category: 'bread_breakfast_dairy', servingGrams: 250, kcal: 451, protein: 9, carbs: 88, fat: 10, confidence: 'high' },
  { id: 'ful-medames', nameEn: 'Ful medames', nameAr: 'فول مدمس', category: 'bread_breakfast_dairy', servingGrams: 200, kcal: 190, protein: 13, carbs: 30, fat: 2, confidence: 'med' },

  // Veg, legume & soup
  { id: 'hummus', nameEn: 'Hummus', nameAr: 'حمص', category: 'veg_legume_soup', servingGrams: 30, servingLabel: '2 tbsp', kcal: 50, protein: 2, carbs: 5, fat: 3, confidence: 'high' },
  { id: 'tabbouleh', nameEn: 'Tabbouleh', nameAr: 'تبولة', category: 'veg_legume_soup', servingGrams: 180, kcal: 200, protein: 4, carbs: 18, fat: 14, confidence: 'med' },
  { id: 'shorbat-adas', nameEn: 'Lentil soup', nameAr: 'شوربة عدس', category: 'veg_legume_soup', servingGrams: 250, kcal: 200, protein: 11, carbs: 32, fat: 4, confidence: 'med' },

  // Street food
  { id: 'mutabbaq', nameEn: 'Mutabbaq, savory', nameAr: 'مطبق', category: 'street_food', servingGrams: 150, servingLabel: '1 piece', kcal: 235, protein: 11, carbs: 24, fat: 10, confidence: 'med' },
  { id: 'falafel', nameEn: 'Falafel', nameAr: 'فلافل', category: 'street_food', servingGrams: 50, servingLabel: '3 pieces', kcal: 165, protein: 6, carbs: 16, fat: 9, confidence: 'med' },

  // Sweets & drinks
  { id: 'kunafa', nameEn: 'Kunafa', nameAr: 'كنافة', category: 'sweets_drinks', servingGrams: 120, servingLabel: '1 piece', kcal: 320, protein: 6, carbs: 40, fat: 16, confidence: 'med' },
  { id: 'luqaimat', nameEn: 'Luqaimat', nameAr: 'لقيمات', category: 'sweets_drinks', servingGrams: 80, servingLabel: '4 pieces', kcal: 280, protein: 4, carbs: 36, fat: 13, confidence: 'med' },
  { id: 'arabic-coffee', nameEn: 'Arabic coffee (Gahwa)', nameAr: 'قهوة عربية', category: 'sweets_drinks', servingLabel: '60 ml cup', kcal: 2, protein: 0, carbs: 0, fat: 0, confidence: 'high' },
  { id: 'laban', nameEn: 'Laban (buttermilk)', nameAr: 'لبن', category: 'sweets_drinks', servingGrams: 245, servingLabel: '1 cup', kcal: 110, protein: 8, carbs: 12, fat: 3, confidence: 'med' },
];

export function findDishById(id: string): Dish | undefined {
  return DISHES.find((d) => d.id === id);
}

export function searchDishes(query: string): Dish[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DISHES.filter(
    (d) => d.nameEn.toLowerCase().includes(q) || d.nameAr.includes(query.trim()),
  );
}
