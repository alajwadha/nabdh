import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen, SegmentedControl } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon } from '../src/components/Icon';
import { useWorkouts } from '../src/store/workouts';
import { useHealthLogs } from '../src/store/health-logs';
import { useMindful } from '../src/store/mindful';
import { useCycle } from '../src/store/cycle';
import {
  SECTIONS,
  buildJson,
  buildCsv,
  exportAndShare,
  recordCount,
  sharingAvailable,
  totalRecords,
  type ExportData,
  type ExportFormat,
  type ExportResult,
  type SectionKey,
} from '../src/services/export';

export default function Export() {
  const { colors, tiles } = useTheme();
  const router = useRouter();

  const { sessions } = useWorkouts();
  const { weight, bp, glucose, meds } = useHealthLogs();
  const { sessions: mindful } = useMindful();
  const { periods } = useCycle();

  const data: ExportData = useMemo(
    () => ({ workouts: sessions, weight, bp, glucose, meds, mindful, cycle: periods }),
    [sessions, weight, bp, glucose, meds, mindful, periods],
  );

  const tintMap = { mint: tiles.mint, blue: tiles.blue, peach: tiles.peach, lav: tiles.lav, gold: tiles.gold, pink: tiles.pink };

  // Default selection: everything that actually has records.
  const [selected, setSelected] = useState<Set<SectionKey>>(
    () => new Set(SECTIONS.filter((s) => recordCount(s.key, data) > 0).map((s) => s.key)),
  );
  const [format, setFormat] = useState<ExportFormat>('json');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);

  // Stores hydrate from AsyncStorage AFTER mount, so a returning user's counts are 0 on
  // the first render. Auto-select sections as their data arrives, but never re-add a
  // section the user explicitly unchecked.
  const touched = useRef<Set<SectionKey>>(new Set());
  useEffect(() => {
    setSelected((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const s of SECTIONS) {
        if (recordCount(s.key, data) > 0 && !touched.current.has(s.key) && !next.has(s.key)) {
          next.add(s.key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [data]);

  const toggle = (key: SectionKey) => {
    touched.current.add(key);
    setResult(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const count = totalRecords(selected, data);
  const sizeKb = useMemo(() => {
    if (count === 0) return 0;
    const text = format === 'json' ? buildJson(selected, data) : buildCsv(selected, data);
    return Math.max(1, Math.round(text.length / 1024));
  }, [format, selected, data, count]);

  const onExport = async () => {
    setBusy(true);
    setResult(null);
    const r = await exportAndShare(format, selected, data);
    setResult(r);
    setBusy(false);
  };

  const resultCopy: Record<ExportResult, { text: string; ok: boolean }> = {
    shared: { text: 'Export shared, choose where to save or send it.', ok: true },
    empty: { text: 'Nothing selected to export.', ok: false },
    unavailable: { text: 'Sharing isn’t available in this build, but your file was prepared.', ok: false },
    error: { text: 'Something went wrong preparing the file. Please try again.', ok: false },
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Export data</AppText>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        Take your data with you. Pick what to include and a format, and Nabdh builds a single file you can save or send. Nothing leaves your phone until you share it.
      </AppText>

      {/* format */}
      <SegmentedControl
        value={format}
        onChange={(v) => { setFormat(v); setResult(null); }}
        options={[{ value: 'json', label: 'JSON' }, { value: 'csv', label: 'CSV' }]}
      />

      {/* checklist */}
      <Card style={{ gap: 0 }}>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: 6 }}>INCLUDE</AppText>
        {SECTIONS.map((s, i) => {
          const n = recordCount(s.key, data);
          const empty = n === 0;
          const on = selected.has(s.key);
          const tint = tintMap[s.tint];
          return (
            <Pressable
              key={s.key}
              disabled={empty}
              onPress={() => toggle(s.key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 11, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border, opacity: empty ? 0.45 : 1 }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={19} color={tint.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title" style={{ fontSize: 15 }}>{s.label}</AppText>
                <AppText variant="caption" color={colors.textMuted}>{empty ? 'No records yet' : `${n} ${n === 1 ? 'record' : 'records'}`}</AppText>
              </View>
              <View style={{ width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: on && !empty ? colors.accent : colors.border, backgroundColor: on && !empty ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {on && !empty && <Icon name="check" size={16} color={colors.accentInk} />}
              </View>
            </Pressable>
          );
        })}
      </Card>

      {/* summary + action */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <AppText variant="caption" color={colors.textMuted}>
          {count} {count === 1 ? 'record' : 'records'} across {selected.size} {selected.size === 1 ? 'type' : 'types'}
        </AppText>
        {count > 0 && <AppText variant="caption" color={colors.textMuted}>~{sizeKb} KB · {format.toUpperCase()}</AppText>}
      </View>

      <Button label={busy ? 'Preparing…' : 'Export & share'} onPress={busy ? undefined : onExport} />

      {result && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: resultCopy[result].ok ? tiles.mint.bg : colors.navBg, borderRadius: radii.lg, padding: spacing.md }}>
          <Icon name={resultCopy[result].ok ? 'check' : 'download'} size={16} color={resultCopy[result].ok ? tiles.mint.ink : colors.textSecondary} />
          <AppText variant="caption" color={resultCopy[result].ok ? tiles.mint.ink : colors.textSecondary} style={{ flex: 1 }}>{resultCopy[result].text}</AppText>
        </View>
      )}

      {!sharingAvailable() && (
        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
          The share sheet needs a full device build, so it won’t open in this preview.
        </AppText>
      )}
    </Screen>
  );
}
