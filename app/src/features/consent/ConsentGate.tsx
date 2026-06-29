import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ConsentType } from '@nabdh/shared';
import { Card, AppText, Button } from '../../design-system/components';
import { colors, spacing } from '../../design-system';
import { CONSENT_I18N } from './consent';

/**
 * Presentational consent gate. The caller persists the decision (setConsent)
 * and decides what to gate on it. Used in onboarding and before HealthKit / AI.
 */
export function ConsentGate({
  type,
  onDecide,
}: {
  type: ConsentType;
  onDecide: (granted: boolean) => void;
}) {
  const { t } = useTranslation();
  const meta = CONSENT_I18N[type];

  return (
    <Card>
      <AppText variant="title">{t(meta.titleKey)}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {t(meta.bodyKey)}
      </AppText>
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <Button label={t('consent.allow')} onPress={() => onDecide(true)} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('consent.decline')}
          hitSlop={8}
          onPress={() => onDecide(false)}
          style={{ alignItems: 'center', paddingVertical: spacing.sm }}
        >
          <AppText variant="caption" color={colors.textMuted}>
            {t('consent.decline')}
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}
