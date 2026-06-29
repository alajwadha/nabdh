// Open Food Facts barcode lookup (free, no key). We only ever surface macros the database
// actually returns; a missing product or missing nutriments yields null, never invented data.

export type FoodProduct = { name: string; brand: string; serving: string; kcal: number; protein: number; carbs: number; fat: number };

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

/** Pure: turn an Open Food Facts v2 product response into a FoodProduct, or null if the
 * product/nutriments/name are missing. Prefers per-serving values, falls back to per-100g. */
export function parseOffProduct(json: any): FoodProduct | null {
  if (!json || json.status !== 1 || !json.product) return null;
  const p = json.product;
  const name = (p.product_name || '').trim();
  if (!name) return null;
  const brand = (typeof p.brands === 'string' ? p.brands.split(',')[0] : '').trim();
  const nut = p.nutriments;
  if (!nut || typeof nut !== 'object') return null;

  const kcalServing = num(nut['energy-kcal_serving']);
  let kcal: number;
  let protein: number;
  let carbs: number;
  let fat: number;
  let serving: string;
  if (kcalServing != null) {
    kcal = kcalServing;
    protein = num(nut.proteins_serving) ?? 0;
    carbs = num(nut.carbohydrates_serving) ?? 0;
    fat = num(nut.fat_serving) ?? 0;
    serving = (typeof p.serving_size === 'string' && p.serving_size.trim()) || '1 serving';
  } else {
    const kcal100 = num(nut['energy-kcal_100g']);
    if (kcal100 == null) return null; // no calories at all, can't show, don't fabricate
    kcal = kcal100;
    protein = num(nut.proteins_100g) ?? 0;
    carbs = num(nut.carbohydrates_100g) ?? 0;
    fat = num(nut.fat_100g) ?? 0;
    serving = '100 g';
  }
  return {
    name,
    brand,
    serving,
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

/** Look up a scanned barcode. Returns null on a bad code, network error, not-found, or
 * missing nutrition data, never throws. */
export async function lookupBarcode(code: string): Promise<FoodProduct | null> {
  const c = (code || '').replace(/\D/g, '');
  if (c.length < 6) return null;
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${c}.json?fields=product_name,nutriments,serving_size,brands`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Nabdh/1.0 (nabdh health app)' } });
    if (!res.ok) return null;
    return parseOffProduct(await res.json());
  } catch {
    return null;
  }
}
