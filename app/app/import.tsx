import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon, type IconName } from '../src/components/Icon';
import { useWorkouts } from '../src/store/workouts';
import { useHealthLogs } from '../src/store/health-logs';
import { useMindful } from '../src/store/mindful';
import { useCycle } from '../src/store/cycle';
import { parseImport, type ImportParse } from '../src/services/import';
import type { SectionKey } from '../src/services/export';

// Lazy-require the document picker so a missing native module degrades to paste-only.
let DocumentPicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DocumentPicker = require('expo-document-picker');
} catch {
  DocumentPicker = null;
}
let FS: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FS = require('expo-file-system/legacy');
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    FS = require('expo-file-system');
  } catch {
    FS = null;
  }
}

const SECTION_META: Record<SectionKey, { label: string; icon: IconName }> = {
  workouts: { label: 'Workouts', icon: 'dumbbell' },
  weight: { label: 'Weight', icon: 'scale' },
  bp: { label: 'Blood pressure', icon: 'heart-pulse' },
  glucose: { label: 'Glucose', icon: 'droplet' },
  meds: { label: 'Medications', icon: 'pill' },
  mindful: { label: 'Breathing', icon: 'wind' },
  cycle: { label: 'Cycle', icon: 'calendar' },
};

export default function Import() {
  const { colors, tiles } = useTheme();
  const router = useRouter();

  const { replaceSessions: replaceWorkouts } = useWorkouts();
  const { replaceLogs } = useHealthLogs();
  const { replaceSessions: replaceMindful } = useMindful();
  const { replacePeriods } = useCycle();

  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ImportParse | null>(null);
  const [done, setDone] = useState(false);

  const filePickAvailable = !!(DocumentPicker && FS);

  const check = (t: string) => {
    setDone(false);
    setParsed(t.trim() ? parseImport(t) : null);
  };

  const pickFile = async () => {
    if (!filePickAvailable) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      const uri = res?.assets?.[0]?.uri ?? (res?.type === 'success' ? res.uri : null);
      if (!uri) return;
      const content = await (FS.readAsStringAsync ? FS.readAsStringAsync(uri) : Promise.resolve(''));
      setText(content);
      check(content);
    } catch {
      /* user cancelled or read failed; paste still works */
    }
  };

  const apply = () => {
    if (!parsed || !parsed.ok || parsed.total === 0) return;
    const d = parsed.data;
    // Replace only the sections present in the file; everything else is left untouched.
    if (d.workouts) replaceWorkouts(d.workouts);
    if (d.mindful) replaceMindful(d.mindful);
    if (d.cycle) replacePeriods(d.cycle);
    const logs: Parameters<typeof replaceLogs>[0] = {};
    if (d.weight) logs.weight = d.weight;
    if (d.bp) logs.bp = d.bp;
    if (d.glucose) logs.glucose = d.glucose;
    if (d.meds) logs.meds = d.meds;
    if (Object.keys(logs).length) replaceLogs(logs);
    setDone(true);
  };

  const sizeKb = useMemo(() => Math.max(0, Math.round(text.length / 1024)), [text]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Import data</AppText>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        Bring data back in from a Nabdh JSON export. {filePickAvailable ? 'Pick the file or paste its contents below.' : 'Paste the contents of the exported file below.'} Importing replaces the sections found in the file, your other data stays as it is.
      </AppText>

      {filePickAvailable && (
        <Button label="Choose a file" variant="line" onPress={pickFile} />
      )}

      {/* paste box */}
      <Card style={{ gap: spacing.sm }}>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4 }}>PASTE JSON</AppText>
        <TextInput
          value={text}
          onChangeText={(t) => { setText(t); check(t); }}
          placeholder='{ "app": "Nabdh", "weight": [ ... ] }'
          placeholderTextColor={colors.textMuted}
          multiline
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Exported JSON"
          style={{ minHeight: 120, maxHeight: 220, color: colors.ink, fontSize: 13, fontFamily: 'Jakarta-Medium', textAlignVertical: 'top', backgroundColor: colors.navBg, borderRadius: radii.md, padding: spacing.md }}
        />
        {text.length > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" color={colors.textMuted}>~{sizeKb} KB pasted</AppText>
            <Pressable onPress={() => { setText(''); setParsed(null); setDone(false); }} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear">
              <AppText variant="caption" color={colors.accentText}>Clear</AppText>
            </Pressable>
          </View>
        )}
      </Card>

      {/* parse feedback */}
      {parsed && !parsed.ok && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tiles.peach.bg, borderRadius: radii.lg, padding: spacing.md }}>
          <Icon name="triangle-alert" size={16} color={tiles.peach.ink} />
          <AppText variant="caption" color={tiles.peach.ink} style={{ flex: 1 }}>{parsed.error}</AppText>
        </View>
      )}

      {parsed && parsed.ok && !done && (
        <>
          <Card style={{ gap: 0 }}>
            <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4, marginBottom: 6 }}>WILL IMPORT</AppText>
            {parsed.sections.length === 0 ? (
              <AppText variant="caption" color={colors.textMuted}>This file is a valid export but has no records to import.</AppText>
            ) : (
              parsed.sections.map((key, i) => {
                const m = SECTION_META[key];
                return (
                  <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 11, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={m.icon} size={19} color={colors.textSecondary} />
                    </View>
                    <AppText variant="title" style={{ flex: 1, fontSize: 15 }}>{m.label}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>{parsed.counts[key]} {parsed.counts[key] === 1 ? 'record' : 'records'}</AppText>
                  </View>
                );
              })
            )}
          </Card>
          {parsed.total > 0 && (
            <>
              <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
                This replaces your existing {parsed.sections.map((k) => SECTION_META[k].label.toLowerCase()).join(', ')} with the {parsed.total} {parsed.total === 1 ? 'record' : 'records'} above. This can't be undone.
              </AppText>
              <Button label={`Import ${parsed.total} ${parsed.total === 1 ? 'record' : 'records'}`} onPress={apply} />
            </>
          )}
        </>
      )}

      {done && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tiles.mint.bg, borderRadius: radii.lg, padding: spacing.md }}>
          <Icon name="check" size={16} color={tiles.mint.ink} />
          <AppText variant="caption" color={tiles.mint.ink} style={{ flex: 1 }}>Imported. Your screens now show the imported data.</AppText>
        </View>
      )}
    </Screen>
  );
}
