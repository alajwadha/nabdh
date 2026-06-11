import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../design-system/components';
import { colors, spacing } from '../design-system';

/** "Connected to Apple Health" indicator (Apple requires it to be visible). */
export function HealthConnectionBadge({ connected }: { connected: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: connected ? colors.accent : colors.textMuted,
        }}
      />
      <AppText variant="caption" color={connected ? colors.accent : colors.textMuted}>
        {connected ? t('home.connected') : t('home.notConnected')}
      </AppText>
    </View>
  );
}
