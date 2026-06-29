import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Pressable, View, type ViewStyle } from 'react-native';
import { AppText } from '../design-system/components';
import { radii, spacing, type TileColor } from '../design-system';
import { useTheme } from '../design-system/theme';
import { PRAYERS, shortLabel } from '../data/prayer';
import { usePrayerTimes } from '../data/usePrayer';
import { Glass } from '../design-system/glass';
import { EnergyCurve } from './Charts';

/** A colored hero card (used by the insight carousel and elsewhere). */
export function Hero({
  bg,
  children,
  style,
}: {
  bg: [string, string] | string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  // RN has no CSS gradient without a lib; use the deeper color as a solid fill.
  const color = Array.isArray(bg) ? bg[1] : bg;
  return (
    <View
      style={[
        { backgroundColor: color, borderRadius: 30, padding: 20, overflow: 'hidden', minHeight: 150, justifyContent: 'center' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function TileGrid({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, style]}>{children}</View>;
}

export function MetricTile({
  label,
  value,
  unit,
  hint,
  color,
  onPress,
  editing,
  onRemove,
}: {
  label: string;
  value?: string | number;
  unit?: string;
  hint?: string;
  color: TileColor;
  onPress?: () => void;
  editing?: boolean;
  onRemove?: () => void;
}) {
  const { tiles, colors } = useTheme();
  const c = tiles[color];
  return (
    <Pressable
      onPress={editing ? undefined : onPress}
      accessibilityRole={editing ? undefined : 'button'}
      accessibilityLabel={editing ? undefined : label}
      style={{ backgroundColor: c.bg, borderRadius: radii.xl, padding: spacing.lg, flexGrow: 1, flexBasis: '46%', minWidth: '46%' }}
    >
      {editing && (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          style={{ position: 'absolute', top: -7, right: -7, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
        >
          <AppText color="#fff" style={{ fontSize: 15, fontWeight: '800', lineHeight: 17 }}>
            ×
          </AppText>
        </Pressable>
      )}
      <AppText variant="caption" color={c.ink} style={{ letterSpacing: 1.4 }}>
        {label.toUpperCase()}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: spacing.xs }}>
        <AppText variant="h1">{value != null ? String(value) : '--'}</AppText>
        {!!unit && (
          <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: 5 }}>
            {unit}
          </AppText>
        )}
      </View>
      {!!hint && (
        <AppText variant="caption" color={c.ink} style={{ marginTop: spacing.xs, fontWeight: '700' }}>
          {hint} ›
        </AppText>
      )}
    </Pressable>
  );
}

export function AddTile({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add metric"
      style={{
        borderRadius: radii.xl,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.border,
        flexGrow: 1,
        flexBasis: '46%',
        minWidth: '46%',
        minHeight: 92,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Icon name="plus" size={20} color={colors.textMuted} />
      <AppText variant="caption" color={colors.textMuted}>
        Add metric
      </AppText>
    </Pressable>
  );
}

export function PrayerStrip({
  highlight,
}: {
  highlight: 'asr' | 'maghrib';
}) {
  const { colors } = useTheme();
  usePrayerTimes(); // re-render when location-based prayer times arrive
  // Single source of truth, same prayer times the planner and fasting timer read.
  // A frosted-glass strip (chrome, not dense data) so it reads as a floating layer.
  return (
    <Glass radius={radii.lg} intensity={28} scrim="strong">
      <View style={{ flexDirection: 'row', gap: 6, padding: 8 }}>
        {PRAYERS.map((p) => {
          const on = p.key === highlight;
          return (
            <View key={p.key} accessible accessibilityLabel={`${p.label} ${shortLabel(p.time)}`} style={{ flex: 1, alignItems: 'center', borderRadius: radii.sm, paddingVertical: 7, backgroundColor: on ? colors.accent : 'transparent' }}>
              <AppText variant="caption" color={on ? '#fff' : colors.textSecondary} style={{ fontSize: 9, letterSpacing: 0.6 }}>
                {p.label.toUpperCase()}
              </AppText>
              <AppText variant="caption" color={on ? '#fff' : colors.ink} style={{ fontSize: 11.5, marginTop: 3 }}>
                {shortLabel(p.time)}
              </AppText>
            </View>
          );
        })}
      </View>
    </Glass>
  );
}

export function PlanList({
  items,
  onToggle,
  labelFor,
  anchorFor,
}: {
  items: { key: string; labelKey: string; anchor?: string; time: string; done: boolean }[];
  onToggle: (key: string) => void;
  labelFor: (key: string) => string;
  anchorFor: (key: string) => string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.xl, paddingHorizontal: spacing.lg }}>
      {items.map((t, i) => (
        <Pressable
          key={t.key}
          onPress={() => onToggle(t.key)}
          accessibilityRole="checkbox"
          accessibilityLabel={labelFor(t.labelKey)}
          accessibilityState={{ checked: t.done }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, borderBottomWidth: i === items.length - 1 ? 0 : 2, borderBottomColor: colors.border }}
        >
          <View style={{ width: 23, height: 23, borderRadius: 9, borderWidth: 2.5, borderColor: t.done ? colors.accent : colors.border, backgroundColor: t.done ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {t.done && <Icon name="check" size={14} color="#fff" stroke={3} />}
          </View>
          <AppText variant="title" style={{ flex: 1, textDecorationLine: t.done ? 'line-through' : 'none', color: t.done ? colors.textMuted : colors.ink }}>
            {labelFor(t.labelKey)}
          </AppText>
          {!!t.anchor && (
            <AppText variant="caption" color={colors.accentText} style={{ fontSize: 9, letterSpacing: 0.5 }}>
              {anchorFor(t.anchor).toUpperCase()}
            </AppText>
          )}
          <AppText variant="caption" color={colors.textMuted}>
            {t.time}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

export function CoachCard({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.navOn, borderRadius: radii.xl, padding: spacing.lg, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
      <View style={{ width: 35, height: 35, borderRadius: 18, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="message-circle" size={18} color={colors.navOnText} />
      </View>
      <AppText variant="body" color={colors.navOnText} style={{ flex: 1, fontSize: 12.5, lineHeight: 19 }}>
        {children}
      </AppText>
    </View>
  );
}

export function EnergyMini({ onPress }: { onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm }}>
        <AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 1.4 }}>
          BODY BATTERY · ENERGY
        </AppText>
        <AppText variant="h2">
          38<AppText variant="caption" color={colors.textMuted}>%</AppText>
        </AppText>
      </View>
      <EnergyCurve color={colors.accentText} />
    </Pressable>
  );
}
