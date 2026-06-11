import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../design-system/components';
import { colors, spacing } from '../design-system';

/** Required on every health-related screen (Apple Guideline 1.4.1 + PDPL). */
export function MedicalDisclaimer() {
  const { t } = useTranslation();
  return (
    <View style={{ paddingTop: spacing.sm }}>
      <AppText variant="caption" color={colors.textMuted}>
        {t('home.disclaimer')}
      </AppText>
    </View>
  );
}
