import { parseOffProduct } from '../src/services/openfoodfacts';

describe('openfoodfacts.parseOffProduct', () => {
  test('per-serving values are preferred', () => {
    const json = {
      status: 1,
      product: {
        product_name: 'Protein Bar',
        brands: 'Acme, Other',
        serving_size: '60 g',
        nutriments: { 'energy-kcal_serving': 240.4, proteins_serving: 20.6, carbohydrates_serving: 24, fat_serving: 7, 'energy-kcal_100g': 400 },
      },
    };
    expect(parseOffProduct(json)).toEqual({ name: 'Protein Bar', brand: 'Acme', serving: '60 g', kcal: 240, protein: 21, carbs: 24, fat: 7 });
  });

  test('falls back to per-100g when no serving values', () => {
    const json = {
      status: 1,
      product: {
        product_name: 'Laban',
        brands: 'Almarai',
        nutriments: { 'energy-kcal_100g': 60, proteins_100g: 3.4, carbohydrates_100g: 4.8, fat_100g: 3.2 },
      },
    };
    expect(parseOffProduct(json)).toEqual({ name: 'Laban', brand: 'Almarai', serving: '100 g', kcal: 60, protein: 3, carbs: 5, fat: 3 });
  });

  test('string numerics are parsed', () => {
    const json = { status: 1, product: { product_name: 'X', nutriments: { 'energy-kcal_100g': '123', proteins_100g: '5' } } };
    expect(parseOffProduct(json)).toMatchObject({ kcal: 123, protein: 5, carbs: 0, fat: 0, serving: '100 g' });
  });

  test('returns null when not found / missing pieces', () => {
    expect(parseOffProduct({ status: 0 })).toBeNull(); // not found
    expect(parseOffProduct(null)).toBeNull();
    expect(parseOffProduct({ status: 1, product: { nutriments: { 'energy-kcal_100g': 100 } } })).toBeNull(); // no name
    expect(parseOffProduct({ status: 1, product: { product_name: 'Y' } })).toBeNull(); // no nutriments
    expect(parseOffProduct({ status: 1, product: { product_name: 'Z', nutriments: {} } })).toBeNull(); // no kcal at all
  });
});
