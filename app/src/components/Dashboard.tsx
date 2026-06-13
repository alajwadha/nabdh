import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { AppText, Button } from '../design-system/components';
import { colors, radii, spacing, tiles, type TileColor } from '../design-system';

// v3-prototype dashboard pieces, rendered in the app's dark theme:
// a readiness hero + a grid of expressive metric tiles.

export function ReadinessHero({
  score,
  label,
  caption,
  emptyText,
  connectLabel,
  onConnect,
}: {
  score: number | null;
  label: string;
  caption: string;
  emptyText: string;
  connectLabel: string;
  onConnect: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.accentDim,
        borderRadius: radii.xl,
        padding: spacing.xl,
        overflow: 'hidden',
      }}
    >
      {score != null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <AppText style={{ fontSize: 72, lineHeight: 74, fontWeight: '800', color: '#FFFFFF' }}>
            {score}
          </AppText>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText
              variant="caption"
              color="#CFF3E6"
              style={{ letterSpacing: 2, fontWeight: '700' }}
            >
              {label.toUpperCase()}
            </AppText>
            <AppText variant="body" color="#FFFFFF" style={{ fontWeight: '700' }}>
              {caption}
            </AppText>
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <AppText variant="title" color="#FFFFFF">
            {emptyText}
          </AppText>
          <Button label={connectLabel} onPress={onConnect} />
        </View>
      )}
    </View>
  );
}

export function MetricTile({
  label,
  value,
  unit,
  hint,
  color,
}: {
  label: string;
  value?: string | number;
  unit?: string;
  hint?: string;
  color: TileColor;
}) {
  const c = tiles[color];
  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: radii.xl,
        padding: spacing.lg,
        flexGrow: 1,
        flexBasis: '46%',
        minWidth: '46%',
      }}
    >
      <AppText variant="caption" color={c.ink} style={{ letterSpacing: 1, fontWeight: '700' }}>
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
        <AppText variant="caption" color={c.ink} style={{ marginTop: spacing.xs }}>
          {hint}
        </AppText>
      )}
    </View>
  );
}

export function TileGrid({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, style]}>
      {children}
    </View>
  );
}
