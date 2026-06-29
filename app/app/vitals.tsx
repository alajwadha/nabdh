import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen, Sheet } from '../src/design-system/components';
import { radii, spacing } from '../src/design-system';
import { useTheme } from '../src/design-system/theme';
import { Icon, type IconName } from '../src/components/Icon';
import { LineChart, CHART_W } from '../src/components/Charts';
import { useHealthLogs, dayKey, type Med } from '../src/store/health-logs';
import { useAppState } from '../src/store/app';
import { displayWeightPrecise, kgToLb, lbToKg } from '../src/services/units';
import { parseTime, ensureNotificationPermission, notificationsAvailable } from '../src/services/notifications';

function Stepper({ value, unit, step, onStep, accent }: { value: number; unit: string; step: number; onStep: (d: number) => void; accent: string }) {
  const { colors } = useTheme();
  const Btn = ({ t, d }: { t: string; d: number }) => (
    <Pressable onPress={() => onStep(d)} hitSlop={6} accessibilityRole="button" accessibilityLabel={t === '+' ? 'Increase' : 'Decrease'} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={t === '+' ? 'plus' : 'minus'} size={16} color={colors.textSecondary} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Btn t="-" d={-step} />
      <View style={{ minWidth: 78, alignItems: 'center' }}>
        <AppText variant="metric" style={{ fontSize: 30, lineHeight: 34 }} color={accent}>{value}</AppText>
      </View>
      <Btn t="+" d={step} />
      <AppText variant="caption" color={colors.textMuted}>{unit}</AppText>
    </View>
  );
}

function VitalCard({ icon, tint, title, latest, sub, children }: { icon: IconName; tint: string; title: string; latest: string; sub: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={20} color={colors.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>{title.toUpperCase()}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <AppText variant="metric" style={{ fontSize: 28, lineHeight: 30 }}>{latest}</AppText>
            <AppText variant="caption" color={colors.textMuted}>{sub}</AppText>
          </View>
        </View>
      </View>
      {children}
    </Card>
  );
}

export default function Vitals() {
  const { colors, tiles } = useTheme();
  const router = useRouter();
  const { weight, bp, glucose, meds, logWeight, logBp, logGlucose, addMed, removeMed, toggleMedToday, setMedReminder, medStreak } = useHealthLogs();
  const { units } = useAppState();

  // Shift a stored HH:MM reminder by a number of minutes, wrapping at midnight.
  const bumpTime = (t: string, mins: number): string => {
    const { hour, minute } = parseTime(t);
    const total = (hour * 60 + minute + mins + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };
  const toggleMedReminder = async (id: string, on: boolean, time?: string) => {
    setMedReminder(id, { reminderOn: on, reminderTime: time || '09:00' });
    if (on) await ensureNotificationPermission();
  };

  const lastW = weight[weight.length - 1]?.kg ?? 80;
  const lastBp = bp[bp.length - 1];
  const lastG = glucose[glucose.length - 1]?.mgdl ?? 100;

  const [wDraft, setWDraft] = useState(Math.round(lastW * 10) / 10);
  const [sys, setSys] = useState(lastBp?.sys ?? 120);
  const [dia, setDia] = useState(lastBp?.dia ?? 80);
  const [gDraft, setGDraft] = useState(lastG);
  const [openLog, setOpenLog] = useState<null | 'weight' | 'bp' | 'glucose'>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newMed, setNewMed] = useState(0);

  const today = dayKey();
  const COMMON = ['Vitamin D', 'Omega-3', 'Magnesium', 'Metformin', 'Multivitamin', 'Iron'];

  const wDelta = weight.length > 1 ? +(lastW - weight[0].kg).toFixed(1) : 0;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="h1">Vitals & meds</AppText>
      </View>

      {/* WEIGHT, line chart */}
      <VitalCard icon="scale" tint={tiles.mint.bg} title="Weight" latest={`${displayWeightPrecise(lastW, units).value} ${displayWeightPrecise(lastW, units).unit}`} sub={`${wDelta <= 0 ? '↓' : '↑'} ${displayWeightPrecise(Math.abs(wDelta), units).value} ${displayWeightPrecise(Math.abs(wDelta), units).unit} since start`}>
        <LineChart data={weight.map((w) => w.kg)} color={colors.accent} width={CHART_W} height={120} />
        <Button label="Log weight" variant="line" onPress={() => { setWDraft(Math.round(lastW * 10) / 10); setOpenLog('weight'); }} />
      </VitalCard>

      {/* BLOOD PRESSURE */}
      <VitalCard icon="heart-pulse" tint={tiles.pink.bg} title="Blood pressure" latest={lastBp ? `${lastBp.sys}/${lastBp.dia}` : '-'} sub="mmHg">
        <LineChart data={bp.map((b) => b.sys)} baseline={120} color="#C2562C" width={CHART_W} height={90} />
        <Button label="Log blood pressure" variant="line" onPress={() => { setSys(lastBp?.sys ?? 120); setDia(lastBp?.dia ?? 80); setOpenLog('bp'); }} />
      </VitalCard>

      {/* GLUCOSE */}
      <VitalCard icon="droplet" tint={tiles.blue.bg} title="Glucose" latest={`${lastG}`} sub="mg/dL">
        <LineChart data={glucose.map((g) => g.mgdl)} baseline={100} color="#2C5C77" width={CHART_W} height={90} />
        <Button label="Log glucose" variant="line" onPress={() => { setGDraft(lastG); setOpenLog('glucose'); }} />
      </VitalCard>

      {/* MEDICATIONS */}
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.2 }}>MEDICATIONS & SUPPLEMENTS</AppText>
          <Pressable onPress={() => setAddOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Add medication" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="plus" size={15} color={colors.accentText} />
            <AppText variant="caption" color={colors.accentText}>Add</AppText>
          </Pressable>
        </View>
        {meds.length === 0 && <AppText variant="caption" color={colors.textMuted}>No medications yet, add one to track it daily.</AppText>}
        {meds.map((m, i) => {
          const taken = m.takenDates.includes(today);
          const streak = medStreak(m);
          const remOn = !!m.reminderOn;
          const remTime = m.reminderTime || '09:00';
          return (
            <View key={m.id} style={{ gap: 8, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: tiles.gold.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="pill" size={18} color={tiles.gold.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="title">{m.name}{m.dose ? <AppText variant="caption" color={colors.textMuted}>  {m.dose}</AppText> : null}</AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <AppText variant="caption" color={colors.textMuted}>{m.schedule}{streak > 0 ? `  ·  ${streak}-day streak` : ''}</AppText>
                    {streak > 0 && <Icon name="flame" size={11} color={colors.textMuted} />}
                  </View>
                </View>
                <Pressable onPress={() => toggleMedToday(m.id)} onLongPress={() => removeMed(m.id)} accessibilityRole="checkbox" accessibilityLabel={`${m.name} taken today`} accessibilityHint="Double tap to toggle, long press to remove" accessibilityState={{ checked: taken }} hitSlop={6} style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: taken ? colors.accent : colors.border, backgroundColor: taken ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {taken && <Icon name="check" size={18} color={colors.accentInk} />}
                </Pressable>
              </View>

              {/* per-med daily reminder */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 48 }}>
                <Pressable
                  onPress={() => toggleMedReminder(m.id, !remOn, remTime)}
                  accessibilityRole="switch"
                  accessibilityLabel={`Daily reminder for ${m.name}`}
                  accessibilityState={{ checked: remOn }}
                  hitSlop={6}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 99, backgroundColor: remOn ? tiles.gold.bg : colors.navBg }}
                >
                  <Icon name={remOn ? 'bell-ring' : 'bell'} size={13} color={remOn ? tiles.gold.ink : colors.textMuted} />
                  <AppText variant="caption" color={remOn ? tiles.gold.ink : colors.textMuted} style={{ fontSize: 12 }}>{remOn ? 'Reminder on' : 'Remind me'}</AppText>
                </Pressable>
                {remOn && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable onPress={() => setMedReminder(m.id, { reminderTime: bumpTime(remTime, -30) })} accessibilityRole="button" accessibilityLabel={`Reminder for ${m.name} earlier`} hitSlop={8} style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="minus" size={13} color={colors.textSecondary} />
                    </Pressable>
                    <AppText variant="caption" style={{ minWidth: 42, textAlign: 'center', fontVariant: ['tabular-nums'] }}>{remTime}</AppText>
                    <Pressable onPress={() => setMedReminder(m.id, { reminderTime: bumpTime(remTime, 30) })} accessibilityRole="button" accessibilityLabel={`Reminder for ${m.name} later`} hitSlop={8} style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: colors.navBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="plus" size={13} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          );
        })}
        {meds.length > 0 && (
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
            Tap the circle to mark taken today · long-press to remove.{!notificationsAvailable() ? ' Reminders need the full app build to fire.' : ''}
          </AppText>
        )}
      </Card>

      {/* log sheets */}
      <Sheet visible={openLog === 'weight'} onClose={() => setOpenLog(null)}>
        <AppText variant="h2" style={{ marginBottom: spacing.lg }}>Log weight</AppText>
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Stepper
            value={units === 'imperial' ? Math.round(kgToLb(wDraft) * 10) / 10 : wDraft}
            unit={units === 'imperial' ? 'lb' : 'kg'}
            step={0.1}
            accent={colors.accent}
            onStep={(d) =>
              setWDraft((w) => {
                const disp = (units === 'imperial' ? kgToLb(w) : w) + d;
                const kg = units === 'imperial' ? lbToKg(disp) : disp;
                return Math.max(20, +kg.toFixed(2));
              })
            }
          />
        </View>
        <Button label="Save" onPress={() => { logWeight(wDraft); setOpenLog(null); }} />
      </Sheet>
      <Sheet visible={openLog === 'bp'} onClose={() => setOpenLog(null)}>
        <AppText variant="h2" style={{ marginBottom: spacing.lg }}>Log blood pressure</AppText>
        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><AppText variant="title">Systolic</AppText><Stepper value={sys} unit="" step={1} accent="#C2562C" onStep={(d) => setSys((v) => Math.max(70, v + d))} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><AppText variant="title">Diastolic</AppText><Stepper value={dia} unit="" step={1} accent="#C2562C" onStep={(d) => setDia((v) => Math.max(40, v + d))} /></View>
        </View>
        <Button label="Save" onPress={() => { logBp(sys, dia); setOpenLog(null); }} />
      </Sheet>
      <Sheet visible={openLog === 'glucose'} onClose={() => setOpenLog(null)}>
        <AppText variant="h2" style={{ marginBottom: spacing.lg }}>Log glucose</AppText>
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Stepper value={gDraft} unit="mg/dL" step={1} accent="#2C5C77" onStep={(d) => setGDraft((v) => Math.max(40, v + d))} />
        </View>
        <Button label="Save" onPress={() => { logGlucose(gDraft); setOpenLog(null); }} />
      </Sheet>
      <Sheet visible={addOpen} onClose={() => setAddOpen(false)}>
        <AppText variant="h2" style={{ marginBottom: spacing.md }}>Add medication</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.md }}>Pick a common one to start tracking it daily.</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
          {COMMON.map((name, i) => (
            <Pressable key={name} onPress={() => setNewMed(i)} accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ selected: newMed === i }} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 99, backgroundColor: newMed === i ? colors.accent : colors.navBg }}>
              <AppText variant="caption" color={newMed === i ? colors.accentInk : colors.ink}>{name}</AppText>
            </Pressable>
          ))}
        </View>
        <Button label={`Add ${COMMON[newMed]}`} onPress={() => { addMed(COMMON[newMed]); setAddOpen(false); }} />
      </Sheet>
    </Screen>
  );
}
