import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen, Sheet } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { useAppState } from '../src/store/app';
import { searchDishes, type Dish } from '../src/data/dishes';
import { barcodeAvailable, ensureCameraPermission, getCameraView } from '../src/services/barcode';

function nowLabel(): string {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

export default function FoodSearch() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { addMeal } = useAppState();

  const [q, setQ] = useState('');
  const [added, setAdded] = useState<string | null>(null);
  const [scan, setScan] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [photo, setPhoto] = useState(false);
  const results = useMemo(() => searchDishes(q), [q]);

  const tintFor = (c: Dish['color']) => tiles[c];

  const add = (d: Dish) => {
    addMeal({ id: `dish-${d.id}-${Date.now()}`, name: d.name, meta: `${nowLabel()} · ${d.serving}`, kcal: d.kcal, color: d.color, protein: d.protein, carbs: d.carbs, fat: d.fat });
    setAdded(d.name);
  };

  const openScanner = async () => {
    setScanMsg(null);
    if (!barcodeAvailable()) {
      setScan(true);
      return;
    }
    const ok = await ensureCameraPermission();
    if (!ok) {
      setScanMsg('Camera permission is needed to scan barcodes.');
      setScan(true);
      return;
    }
    setScan(true);
  };

  const onScanned = (code: string) => {
    // We don't ship a packaged-food database, be honest, never invent macros.
    setScanMsg(`No match for ${code}. Search the dish above or add it manually.`);
  };

  const CameraView = getCameraView();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Add food</AppText>
      </View>

      {/* search box */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: spacing.md, height: 50 }}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={q}
          onChangeText={(t) => { setQ(t); setAdded(null); }}
          placeholder="Search dishes, kabsa, foul, dates…"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={{ flex: 1, color: colors.ink, fontSize: 15, fontFamily: 'Jakarta-Medium' }}
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Icon name="x" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* scan + photo actions */}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable onPress={openScanner} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.navBg, borderRadius: radii.lg, paddingVertical: 13 }}>
          <Icon name="scan-barcode" size={18} color={colors.ink} />
          <AppText variant="caption" color={colors.ink} style={{ fontWeight: '700' }}>Scan barcode</AppText>
        </Pressable>
        <Pressable onPress={() => setPhoto(true)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.navBg, borderRadius: radii.lg, paddingVertical: 13 }}>
          <Icon name="camera" size={18} color={colors.ink} />
          <AppText variant="caption" color={colors.ink} style={{ fontWeight: '700' }}>Snap a meal</AppText>
        </Pressable>
      </View>

      {added && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tiles.mint.bg, borderRadius: radii.lg, padding: spacing.md }}>
          <Icon name="check" size={16} color={tiles.mint.ink} />
          <AppText variant="caption" color={tiles.mint.ink} style={{ flex: 1 }}>Added {added} to today’s log.</AppText>
        </View>
      )}

      {/* results */}
      <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginLeft: 2 }}>{q ? `${results.length} RESULT${results.length === 1 ? '' : 'S'}` : 'GULF DISHES'}</AppText>
      {results.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 6, paddingVertical: spacing.xl }}>
          <Icon name="soup" size={26} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted}>No match. Try another name, or scan a barcode.</AppText>
        </Card>
      ) : (
        results.map((d) => {
          const t = tintFor(d.color);
          return (
            <Pressable key={d.id} onPress={() => add(d)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="utensils" size={19} color={t.ink} />
              </View>
              <View style={{ flex: 1 }}>
                {/* Keep Arabic in its OWN text node so it doesn't bidi-reorder the LTR macros. */}
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
                  <AppText variant="title" style={{ fontSize: 15 }}>{d.name}</AppText>
                  <AppText variant="caption" color={colors.textMuted}>{d.ar}</AppText>
                </View>
                <AppText variant="caption" color={colors.textMuted}>{d.serving} · P{d.protein} C{d.carbs} F{d.fat}</AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="metric" style={{ fontSize: 17, lineHeight: 20 }}>{d.kcal}</AppText>
                <AppText variant="caption" color={colors.textMuted}>kcal</AppText>
              </View>
              <Icon name="plus" size={18} color={colors.accentText} />
            </Pressable>
          );
        })
      )}

      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 2 }}>
        Macros are typical per-serving estimates for a home portion.
      </AppText>

      {/* barcode scanner sheet */}
      <Sheet visible={scan} onClose={() => setScan(false)}>
        <AppText variant="h2" style={{ marginBottom: spacing.md }}>Scan barcode</AppText>
        {barcodeAvailable() && CameraView ? (
          <View style={{ height: 260, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: '#000' }}>
            <CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} onBarcodeScanned={(e: any) => onScanned(e?.data ?? '')} />
          </View>
        ) : (
          <AppText variant="caption" color={colors.textMuted} style={{ lineHeight: 18 }}>
            Barcode scanning needs the full app build with the camera, so it won’t open in this preview. You can still search dishes above.
          </AppText>
        )}
        {scanMsg && (
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, lineHeight: 18 }}>{scanMsg}</AppText>
        )}
        <View style={{ height: spacing.md }} />
        <Button label="Done" variant="line" onPress={() => setScan(false)} />
      </Sheet>

      {/* photo → macros honest stub */}
      <Sheet visible={photo} onClose={() => setPhoto(false)}>
        <AppText variant="h2" style={{ marginBottom: spacing.sm }}>Snap a meal</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: tiles.lav.bg, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.lg }}>
          <Icon name="camera" size={22} color={tiles.lav.ink} />
          <AppText variant="caption" color={tiles.lav.ink} style={{ flex: 1, lineHeight: 18 }}>
            Photo → macros needs the on-device vision model, which isn’t wired up yet. Rather than guess your plate’s numbers, search the dish or add it manually for now.
          </AppText>
        </View>
        <Button label="Search a dish instead" onPress={() => setPhoto(false)} />
      </Sheet>
    </Screen>
  );
}
